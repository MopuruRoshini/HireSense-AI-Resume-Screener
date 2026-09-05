import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { logger } from '../config/logger';
import { prisma } from '../config/prisma';
import { getAIProvider } from '../ai';
import { extractTextFromFile } from '../utils/fileProcessor';
import { MatchCategory } from '@prisma/client';

export interface ResumeProcessingJob {
  resumeId: string;
  candidateId: string;
  jobId: string;
  filePath: string;
  mimeType: string;
  batchId?: string;
  totalInBatch?: number;
  indexInBatch?: number;
}

// SSE clients map: batchId -> Set of response writers
export const sseClients = new Map<string, Set<(data: string) => void>>();

let resumeQueue: Queue | null = null;
let resumeWorker: Worker | null = null;
let redisAvailable = false;

function createRedisConnection(): IORedis {
  const client = new IORedis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: () => null, // Don't retry indefinitely if down
    lazyConnect: true,
  });

  client.on('error', (err) => {
    logger.warn(`Redis connection error: ${err.message}`);
    redisAvailable = false;
  });

  client.on('connect', () => {
    redisAvailable = true;
    logger.info('✓ Redis connected');
  });

  return client;
}

export function getResumeQueue(): Queue | null {
  if (!resumeQueue) {
    try {
      const connection = createRedisConnection();
      resumeQueue = new Queue('resume-processing', {
        connection,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      });
      resumeQueue.on('error', (err) => {
        logger.warn(`Redis queue error: ${err.message}`);
      });
    } catch {
      logger.warn('Redis queue could not be created, using in-process processing');
      resumeQueue = null;
    }
  }
  return resumeQueue;
}

export async function queueResume(data: ResumeProcessingJob): Promise<void> {
  const queue = getResumeQueue();
  if (queue && redisAvailable) {
    try {
      await queue.add('process-resume', data);
      return;
    } catch (err) {
      logger.warn('Failed to queue to Redis, executing in background', { err });
    }
  }

  // Fallback: process directly in background
  setImmediate(() => {
    processResume(data).catch((err) => {
      logger.error(`Error processing resume ${data.resumeId}:`, { err });
    });
  });
}

export async function processResume(data: ResumeProcessingJob): Promise<void> {
  const ai = getAIProvider();
  const { resumeId, candidateId, jobId, filePath, mimeType, batchId, totalInBatch, indexInBatch } = data;

  logger.info(`Processing resume ${resumeId} for job ${jobId}`);

  try {
    // 1. Update status to parsing
    await prisma.resume.update({ where: { id: resumeId }, data: { status: 'PARSING' } });
    await broadcastProgress(batchId, indexInBatch, totalInBatch, 'Extracting text...');

    // 2. Extract text
    const rawText = await extractTextFromFile(filePath, mimeType);
    await prisma.resume.update({
      where: { id: resumeId },
      data: { rawText, status: 'PARSED', parsedAt: new Date() },
    });

    await broadcastProgress(batchId, indexInBatch, totalInBatch, 'Parsing candidate information...');

    // 3. Parse resume with AI
    const parsed = await ai.parseResume(rawText);

    // 4. Update candidate with parsed info
    await prisma.candidate.update({
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
      await prisma.candidateSkill.createMany({
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
      await prisma.workExperience.createMany({
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
      await prisma.education.createMany({
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
      await prisma.project.createMany({
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
      await prisma.certification.createMany({
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
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { skills: true },
    });

    if (!job) throw new Error('Job not found');

    const jobSkills = job.skills.map((s) => s.skill);
    const startTime = Date.now();

    // 11. Match candidate to job
    const matchResult = await ai.matchCandidateToJob(rawText, job.description, jobSkills);
    const processingTimeMs = Date.now() - startTime;

    // 12. Determine match category
    const matchCategory = scoreToCategory(matchResult.overallScore);

    // 13. Store screening result
    const screeningResult = await prisma.screeningResult.create({
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
        aiModel: config.ai.model,
        processingTimeMs,
      },
    });

    // 14. Update candidate skills with match info
    for (const skill of matchResult.matchedSkills) {
      await prisma.candidateSkill.updateMany({
        where: { candidateId, skill: { contains: skill, mode: 'insensitive' } },
        data: { isMatched: true },
      });
    }
    for (const skill of matchResult.missingSkills) {
      await prisma.candidateSkill.create({
        data: { candidateId, skill, isMissing: true },
      }).catch(() => {});
    }
    for (const skill of matchResult.bonusSkills) {
      await prisma.candidateSkill.updateMany({
        where: { candidateId, skill: { contains: skill, mode: 'insensitive' } },
        data: { isBonus: true },
      });
    }

    // 15. Update candidate overall score
    await prisma.candidate.update({
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
    await prisma.stageHistory.create({
      data: {
        candidateId,
        fromStatus: 'APPLIED',
        toStatus: 'SCREENING',
      },
    });

    // 17. Emit analytics event
    await prisma.analyticsEvent.create({
      data: {
        event: 'CANDIDATE_SCREENED',
        entityId: candidateId,
        entityType: 'CANDIDATE',
        metadata: { jobId, score: matchResult.overallScore, category: matchCategory },
      },
    });

    // 18. Notify user
    const jobWithUser = await prisma.job.findUnique({
      where: { id: jobId },
      select: { createdById: true, title: true },
    });

    if (jobWithUser) {
      await prisma.notification.create({
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

    logger.info(`Completed resume ${resumeId}: score=${matchResult.overallScore}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Error processing resume ${resumeId}: ${errorMsg}`, { err });

    await prisma.resume.update({
      where: { id: resumeId },
      data: { status: 'FAILED', errorMessage: errorMsg },
    }).catch(() => {});

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: 'REJECTED', notes: `Processing failed: ${errorMsg}` },
    }).catch(() => {});

    await broadcastProgress(batchId, indexInBatch, totalInBatch, `Failed: ${errorMsg}`, true, {
      error: errorMsg,
      failed: true,
    });
  }
}

export function startResumeWorker(): void {
  try {
    const connection = createRedisConnection();
    resumeWorker = new Worker<ResumeProcessingJob>(
      'resume-processing',
      async (job: Job<ResumeProcessingJob>) => {
        await processResume(job.data);
      },
      { connection }
    );

    resumeWorker.on('error', (err) => {
      logger.warn(`Resume worker error: ${err.message}`);
    });
  } catch {
    logger.warn('Redis unavailable, background queue worker not started');
  }
}

function scoreToCategory(score: number): MatchCategory {
  if (score >= 85) return 'STRONG';
  if (score >= 70) return 'GOOD';
  if (score >= 50) return 'MODERATE';
  return 'WEAK';
}

async function broadcastProgress(
  batchId: string | undefined,
  index: number | undefined,
  total: number | undefined,
  stage: string,
  complete = false,
  data?: Record<string, unknown>
): Promise<void> {
  if (!batchId) return;
  const clients = sseClients.get(batchId);
  if (!clients) return;

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
    } catch {
      clients.delete(send);
    }
  }
}

export async function stopQueues(): Promise<void> {
  await resumeWorker?.close().catch(() => {});
  await resumeQueue?.close().catch(() => {});
}
