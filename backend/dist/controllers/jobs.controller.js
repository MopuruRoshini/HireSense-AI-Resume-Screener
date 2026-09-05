"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeJobDescription = exports.deleteJob = exports.updateJob = exports.createJob = exports.getJob = exports.getJobs = void 0;
const prisma_1 = require("../config/prisma");
const response_1 = require("../utils/response");
const ai_1 = require("../ai");
const getJobs = async (req, res) => {
    const { page = '1', limit = '20', status, search } = req.query;
    const orgId = req.user.organizationId;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const where = {
        ...(orgId ? { organizationId: orgId } : {}),
        ...(status ? { status: status } : {}),
        ...(search
            ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { department: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}),
    };
    const [jobs, total] = await Promise.all([
        prisma_1.prisma.job.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            include: {
                skills: true,
                _count: { select: { candidates: true } },
                createdBy: { select: { firstName: true, lastName: true } },
            },
        }),
        prisma_1.prisma.job.count({ where }),
    ]);
    const jobsWithStats = await Promise.all(jobs.map(async (job) => {
        const avgScore = await prisma_1.prisma.candidate.aggregate({
            where: { jobId: job.id, overallScore: { not: null } },
            _avg: { overallScore: true },
        });
        return {
            ...job,
            candidateCount: job._count.candidates,
            averageMatchScore: avgScore._avg.overallScore
                ? Math.round(avgScore._avg.overallScore)
                : null,
        };
    }));
    (0, response_1.sendPaginated)(res, jobsWithStats, total, pageNum, limitNum);
};
exports.getJobs = getJobs;
const getJob = async (req, res) => {
    const id = req.params.id;
    const job = await prisma_1.prisma.job.findUnique({
        where: { id },
        include: {
            skills: true,
            createdBy: { select: { firstName: true, lastName: true, email: true } },
            _count: { select: { candidates: true, screeningResults: true } },
        },
    });
    if (!job) {
        (0, response_1.sendError)(res, 'Job not found', 'NOT_FOUND', 404);
        return;
    }
    const stats = await prisma_1.prisma.candidate.groupBy({
        by: ['status'],
        where: { jobId: id },
        _count: { status: true },
    });
    (0, response_1.sendSuccess)(res, { ...job, stats });
};
exports.getJob = getJob;
const createJob = async (req, res) => {
    const orgId = req.user.organizationId;
    if (!orgId) {
        (0, response_1.sendError)(res, 'Organization required', 'ORG_REQUIRED', 400);
        return;
    }
    const { title, department, location, locationType, employmentType, experienceMin, experienceMax, salaryMin, salaryMax, salaryCurrency, description, requirements, responsibilities, benefits, openings, status } = req.body;
    const job = await prisma_1.prisma.job.create({
        data: {
            title, department, location, locationType, employmentType,
            experienceMin, experienceMax, salaryMin, salaryMax,
            salaryCurrency: salaryCurrency || 'USD', description,
            requirements, responsibilities, benefits,
            openings: openings || 1,
            status: status || 'DRAFT',
            organizationId: orgId,
            createdById: req.user.userId,
        },
        include: { skills: true },
    });
    // Trigger AI JD analysis in background
    analyzeJobInBackground(job.id, description).catch(() => { });
    await prisma_1.prisma.auditLog.create({
        data: { userId: req.user.userId, action: 'JOB_CREATED', entityType: 'JOB', entityId: job.id },
    });
    await prisma_1.prisma.analyticsEvent.create({
        data: { event: 'JOB_CREATED', entityId: job.id, entityType: 'JOB', orgId },
    });
    (0, response_1.sendSuccess)(res, job, 'Job created successfully', 201);
};
exports.createJob = createJob;
const updateJob = async (req, res) => {
    const id = req.params.id;
    const job = await prisma_1.prisma.job.findUnique({ where: { id } });
    if (!job) {
        (0, response_1.sendError)(res, 'Job not found', 'NOT_FOUND', 404);
        return;
    }
    const updated = await prisma_1.prisma.job.update({
        where: { id },
        data: req.body,
        include: { skills: true },
    });
    await prisma_1.prisma.auditLog.create({
        data: { userId: req.user.userId, action: 'JOB_UPDATED', entityType: 'JOB', entityId: id },
    });
    (0, response_1.sendSuccess)(res, updated, 'Job updated successfully');
};
exports.updateJob = updateJob;
const deleteJob = async (req, res) => {
    const id = req.params.id;
    const job = await prisma_1.prisma.job.findUnique({ where: { id } });
    if (!job) {
        (0, response_1.sendError)(res, 'Job not found', 'NOT_FOUND', 404);
        return;
    }
    await prisma_1.prisma.job.update({ where: { id }, data: { status: 'ARCHIVED' } });
    await prisma_1.prisma.auditLog.create({
        data: { userId: req.user.userId, action: 'JOB_DELETED', entityType: 'JOB', entityId: id },
    });
    (0, response_1.sendSuccess)(res, null, 'Job archived successfully');
};
exports.deleteJob = deleteJob;
const analyzeJobDescription = async (req, res) => {
    const { jobId } = req.body;
    const job = await prisma_1.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
        (0, response_1.sendError)(res, 'Job not found', 'NOT_FOUND', 404);
        return;
    }
    const ai = (0, ai_1.getAIProvider)();
    const analysis = await ai.analyzeJobDescription(job.description);
    // Store extracted skills
    await prisma_1.prisma.jobSkill.deleteMany({ where: { jobId } });
    if (analysis.requiredSkills.length > 0) {
        await prisma_1.prisma.jobSkill.createMany({
            data: analysis.requiredSkills.map((skill) => ({ jobId, skill, isRequired: true })),
            skipDuplicates: true,
        });
    }
    if (analysis.preferredSkills.length > 0) {
        await prisma_1.prisma.jobSkill.createMany({
            data: analysis.preferredSkills.map((skill) => ({ jobId, skill, isRequired: false })),
            skipDuplicates: true,
        });
    }
    await prisma_1.prisma.job.update({
        where: { id: jobId },
        data: { aiAnalyzed: true, aiSummary: analysis.summary, seniority: analysis.seniority, domain: analysis.domain },
    });
    (0, response_1.sendSuccess)(res, analysis, 'Job description analyzed successfully');
};
exports.analyzeJobDescription = analyzeJobDescription;
async function analyzeJobInBackground(jobId, description) {
    const ai = (0, ai_1.getAIProvider)();
    const analysis = await ai.analyzeJobDescription(description);
    await prisma_1.prisma.jobSkill.createMany({
        data: [
            ...analysis.requiredSkills.map((skill) => ({ jobId, skill, isRequired: true })),
            ...analysis.preferredSkills.map((skill) => ({ jobId, skill, isRequired: false })),
        ],
        skipDuplicates: true,
    });
    await prisma_1.prisma.job.update({
        where: { id: jobId },
        data: { aiAnalyzed: true, aiSummary: analysis.summary, seniority: analysis.seniority, domain: analysis.domain },
    });
}
//# sourceMappingURL=jobs.controller.js.map