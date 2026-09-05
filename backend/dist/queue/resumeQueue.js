"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sseClients = void 0;
exports.getResumeQueue = getResumeQueue;
exports.queueResume = queueResume;
exports.processResume = processResume;
exports.startResumeWorker = startResumeWorker;
exports.stopQueues = stopQueues;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
const logger_1 = require("../config/logger");
const prisma_1 = require("../config/prisma");
const ai_1 = require("../ai");
const fileProcessor_1 = require("../utils/fileProcessor");
// SSE clients map: batchId -> Set of response writers
exports.sseClients = new Map();
let resumeQueue = null;
let resumeWorker = null;
let redisAvailable = false;
function createRedisConnection() {
    const client = new ioredis_1.default(config_1.config.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: () => null, // Don't retry indefinitely if down
        lazyConnect: true,
    });
    client.on('error', (err) => {
        logger_1.logger.warn(`Redis connection error: ${err.message}`);
        redisAvailable = false;
    });
    client.on('connect', () => {
        redisAvailable = true;
        logger_1.logger.info('✓ Redis connected');
    });
    return client;
}
function getResumeQueue() {
    if (!resumeQueue) {
        try {
            const connection = createRedisConnection();
            resumeQueue = new bullmq_1.Queue('resume-processing', {
                connection,
                defaultJobOptions: {
                    removeOnComplete: 100,
                    removeOnFail: 50,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                },
            });
            resumeQueue.on('error', (err) => {
                logger_1.logger.warn(`Redis queue error: ${err.message}`);
            });
        }
        catch {
            logger_1.logger.warn('Redis queue could not be created, using in-process processing');
            resumeQueue = null;
        }
    }
    return resumeQueue;
}
async function queueResume(data) {
    const queue = getResumeQueue();
    if (queue && redisAvailable) {
        try {
            await queue.add('process-resume', data);
            return;
        }
        catch (err) {
            logger_1.logger.warn('Failed to queue to Redis, executing in background', { err });
        }
    }
    // Fallback: process directly in background
    setImmediate(() => {
        processResume(data).catch((err) => {
            logger_1.logger.error(`Error processing resume ${data.resumeId}:`, { err });
        });
    });
}
async function processResume(data) {
    const ai = (0, ai_1.getAIProvider)();
    const { resumeId, candidateId, jobId, filePath, mimeType, batchId, totalInBatch, indexInBatch } = data;
    logger_1.logger.info(`Processing resume ${resumeId} for job ${jobId}`);
    try {
        // 1. Update status to parsing
        await prisma_1.prisma.resume.update({ where: { id: resumeId }, data: { status: 'PARSING' } });
        await broadcastProgress(batchId, indexInBatch, totalInBatch, 'Extracting text...');
        // 2. Extract text
        const rawText = await (0, fileProcessor_1.extractTextFromFile)(filePath, mimeType);
        await prisma_1.prisma.resume.update({
            where: { id: resumeId },
            data: { rawText, status: 'PARSED', parsedAt: new Date() },
        });
        await broadcastProgress(batchId, indexInBatch, totalInBatch, 'Parsing candidate information...');
        // 3. Parse resume with AI
        const parsed = await ai.parseResume(rawText);
        // 4. Update candidate with parsed info
        await prisma_1.prisma.candidate.update({
            where: { id: candidateId },
            data: {
                firstName: parsed.firstName,
                lastName: parsed.lastName,
                email: parsed.email,
                phone: parsed.phone,
                location: parsed.location,
                professionalTitle: parsed.professionalTitle,
                summary: parsed.summary,
                yearsOfExperience: parsed.yearsOfExperience,
                linkedinUrl: parsed.linkedinUrl,
                githubUrl: parsed.githubUrl,
                portfolioUrl: parsed.portfolioUrl,
                status: 'SCREENING',
            },
        });
        // 5. Store skills
        if (parsed.skills && parsed.skills.length > 0) {
            await prisma_1.prisma.candidateSkill.createMany({
                data: parsed.skills.map((s) => ({
                    candidateId,
                    skill: s.name,
                    proficiency: s.proficiency,
                    yearsUsed: s.yearsUsed,
                })),
                skipDuplicates: true,
            });
        }
        // 6. Store experience
        if (parsed.experience && parsed.experience.length > 0) {
            await prisma_1.prisma.workExperience.createMany({
                data: parsed.experience.map((e) => ({
                    candidateId,
                    company: e.company,
                    title: e.title,
                    location: e.location,
                    startDate: e.startDate,
                    endDate: e.endDate,
                    isCurrent: e.isCurrent,
                    description: e.description,
                })),
            });
        }
        // 7. Store education
        if (parsed.education && parsed.education.length > 0) {
            await prisma_1.prisma.education.createMany({
                data: parsed.education.map((e) => ({
                    candidateId,
                    institution: e.institution,
                    degree: e.degree,
                    field: e.field,
                    startYear: e.startYear,
                    endYear: e.endYear,
                    gpa: e.gpa,
                })),
            });
        }
        // 8. Store projects
        if (parsed.projects && parsed.projects.length > 0) {
            await prisma_1.prisma.project.createMany({
                data: parsed.projects.map((p) => ({
                    candidateId,
                    name: p.name,
                    description: p.description,
                    techStack: p.techStack,
                    url: p.url,
                })),
            });
        }
        // 9. Store certifications
        if (parsed.certifications && parsed.certifications.length > 0) {
            await prisma_1.prisma.certification.createMany({
                data: parsed.certifications.map((c) => ({
                    candidateId,
                    name: c.name,
                    issuer: c.issuer,
                    issuedDate: c.issuedDate,
                    expiryDate: c.expiryDate,
                    credentialId: c.credentialId,
                })),
            });
        }
        await broadcastProgress(batchId, indexInBatch, totalInBatch, 'Analyzing match...');
        // 10. Get job details for matching
        const job = await prisma_1.prisma.job.findUnique({
            where: { id: jobId },
            include: { skills: true },
        });
        if (!job)
            throw new Error('Job not found');
        const jobSkills = job.skills.map((s) => s.skill);
        const startTime = Date.now();
        // 11. Match candidate to job
        const matchResult = await ai.matchCandidateToJob(rawText, job.description, jobSkills);
        const processingTimeMs = Date.now() - startTime;
        // 12. Determine match category
        const matchCategory = scoreToCategory(matchResult.overallScore);
        // 13. Store screening result
        const screeningResult = await prisma_1.prisma.screeningResult.create({
            data: {
                candidateId,
                jobId,
                overallScore: matchResult.overallScore,
                matchCategory,
                skillsScore: matchResult.breakdown.skills,
                experienceScore: matchResult.breakdown.experience,
                projectsScore: matchResult.breakdown.projects,
                educationScore: matchResult.breakdown.education,
                certificationsScore: matchResult.breakdown.certifications,
                domainScore: matchResult.breakdown.domain,
                matchedSkills: matchResult.matchedSkills,
                missingSkills: matchResult.missingSkills,
                bonusSkills: matchResult.bonusSkills,
                strengths: matchResult.strengths,
                weaknesses: matchResult.weaknesses,
                explanation: matchResult.explanation,
                aiModel: config_1.config.ai.model,
                processingTimeMs,
            },
        });
        // 14. Update candidate skills with match info
        for (const skill of matchResult.matchedSkills) {
            await prisma_1.prisma.candidateSkill.updateMany({
                where: { candidateId, skill: { contains: skill, mode: 'insensitive' } },
                data: { isMatched: true },
            });
        }
        for (const skill of matchResult.missingSkills) {
            await prisma_1.prisma.candidateSkill.create({
                data: { candidateId, skill, isMissing: true },
            }).catch(() => { });
        }
        for (const skill of matchResult.bonusSkills) {
            await prisma_1.prisma.candidateSkill.updateMany({
                where: { candidateId, skill: { contains: skill, mode: 'insensitive' } },
                data: { isBonus: true },
            });
        }
        // 15. Update candidate overall score
        await prisma_1.prisma.candidate.update({
            where: { id: candidateId },
            data: {
                overallScore: matchResult.overallScore,
                matchCategory,
                aiRecommendation: matchResult.recommendation,
                aiConfidence: matchResult.confidence,
                status: 'SCREENING',
            },
        });
        // 16. Store stage history
        await prisma_1.prisma.stageHistory.create({
            data: {
                candidateId,
                fromStatus: 'APPLIED',
                toStatus: 'SCREENING',
            },
        });
        // 17. Emit analytics event
        await prisma_1.prisma.analyticsEvent.create({
            data: {
                event: 'CANDIDATE_SCREENED',
                entityId: candidateId,
                entityType: 'CANDIDATE',
                metadata: { jobId, score: matchResult.overallScore, category: matchCategory },
            },
        });
        // 18. Notify user
        const jobWithUser = await prisma_1.prisma.job.findUnique({
            where: { id: jobId },
            select: { createdById: true, title: true },
        });
        if (jobWithUser) {
            await prisma_1.prisma.notification.create({
                data: {
                    userId: jobWithUser.createdById,
                    type: 'SCREENING_COMPLETE',
                    title: 'Resume Screened',
                    message: `${parsed.firstName} ${parsed.lastName} scored ${matchResult.overallScore}% for ${jobWithUser.title}`,
                    entityId: candidateId,
                    entityType: 'CANDIDATE',
                },
            });
        }
        await broadcastProgress(batchId, indexInBatch, totalInBatch, 'Complete', true, {
            candidateId,
            score: matchResult.overallScore,
            matchCategory,
            screeningResultId: screeningResult.id,
        });
        logger_1.logger.info(`Completed resume ${resumeId}: score=${matchResult.overallScore}`);
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        logger_1.logger.error(`Error processing resume ${resumeId}: ${errorMsg}`, { err });
        await prisma_1.prisma.resume.update({
            where: { id: resumeId },
            data: { status: 'FAILED', errorMessage: errorMsg },
        }).catch(() => { });
        await prisma_1.prisma.candidate.update({
            where: { id: candidateId },
            data: { status: 'REJECTED', notes: `Processing failed: ${errorMsg}` },
        }).catch(() => { });
        await broadcastProgress(batchId, indexInBatch, totalInBatch, `Failed: ${errorMsg}`, true, {
            error: errorMsg,
            failed: true,
        });
    }
}
function startResumeWorker() {
    try {
        const connection = createRedisConnection();
        resumeWorker = new bullmq_1.Worker('resume-processing', async (job) => {
            await processResume(job.data);
        }, { connection });
        resumeWorker.on('error', (err) => {
            logger_1.logger.warn(`Resume worker error: ${err.message}`);
        });
    }
    catch {
        logger_1.logger.warn('Redis unavailable, background queue worker not started');
    }
}
function scoreToCategory(score) {
    if (score >= 85)
        return 'STRONG';
    if (score >= 70)
        return 'GOOD';
    if (score >= 50)
        return 'MODERATE';
    return 'WEAK';
}
async function broadcastProgress(batchId, index, total, stage, complete = false, data) {
    if (!batchId)
        return;
    const clients = exports.sseClients.get(batchId);
    if (!clients)
        return;
    const payload = JSON.stringify({
        type: complete ? 'complete' : 'progress',
        stage,
        processed: (index ?? 0) + 1,
        total: total ?? 1,
        percentage: total ? Math.round(((index ?? 0) + 1) / total * 100) : 100,
        ...(data || {}),
    });
    for (const send of clients) {
        try {
            send(`data: ${payload}\n\n`);
        }
        catch {
            clients.delete(send);
        }
    }
}
async function stopQueues() {
    await resumeWorker?.close().catch(() => { });
    await resumeQueue?.close().catch(() => { });
}
//# sourceMappingURL=resumeQueue.js.map