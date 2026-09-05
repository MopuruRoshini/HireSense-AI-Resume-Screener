"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCandidates = exports.removeTag = exports.addTag = exports.compareCandidates = exports.rejectCandidate = exports.shortlistCandidate = exports.updateCandidate = exports.getCandidate = exports.getCandidates = void 0;
const prisma_1 = require("../config/prisma");
const response_1 = require("../utils/response");
const getCandidates = async (req, res) => {
    const { page = '1', limit = '20', jobId, status, search, minScore, maxScore, sortBy = 'overallScore', sortOrder = 'desc', } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (jobId)
        where.jobId = jobId;
    if (status)
        where.status = status;
    if (minScore || maxScore) {
        where.overallScore = {
            ...(minScore ? { gte: parseFloat(minScore) } : {}),
            ...(maxScore ? { lte: parseFloat(maxScore) } : {}),
        };
    }
    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { professionalTitle: { contains: search, mode: 'insensitive' } },
        ];
    }
    // Exclude placeholders
    where.NOT = { firstName: 'Processing' };
    const orderBy = {};
    if (sortBy === 'overallScore')
        orderBy.overallScore = sortOrder;
    else if (sortBy === 'name')
        orderBy.firstName = sortOrder;
    else if (sortBy === 'createdAt')
        orderBy.createdAt = sortOrder;
    else
        orderBy.overallScore = 'desc';
    const [candidates, total] = await Promise.all([
        prisma_1.prisma.candidate.findMany({
            where,
            skip,
            take: limitNum,
            orderBy,
            include: {
                resume: { select: { originalName: true, mimeType: true } },
                skills: { where: { isMatched: true }, take: 6 },
                tags: true,
                job: { select: { title: true } },
                screeningResult: {
                    select: {
                        overallScore: true,
                        matchCategory: true,
                        matchedSkills: true,
                        missingSkills: true,
                    },
                },
            },
        }),
        prisma_1.prisma.candidate.count({ where }),
    ]);
    (0, response_1.sendPaginated)(res, candidates, total, pageNum, limitNum);
};
exports.getCandidates = getCandidates;
const getCandidate = async (req, res) => {
    const id = req.params.id;
    const candidate = await prisma_1.prisma.candidate.findUnique({
        where: { id },
        include: {
            resume: true,
            skills: true,
            tags: true,
            experience: { orderBy: { startDate: 'desc' } },
            education: true,
            projects: true,
            certifications: true,
            screeningResult: { include: { factors: true } },
            interviews: { include: { questions: { orderBy: { orderIndex: 'asc' } } } },
            stageHistory: { orderBy: { changedAt: 'desc' } },
            job: { select: { title: true, department: true, description: true } },
        },
    });
    if (!candidate) {
        (0, response_1.sendError)(res, 'Candidate not found', 'NOT_FOUND', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, candidate);
};
exports.getCandidate = getCandidate;
const updateCandidate = async (req, res) => {
    const id = req.params.id;
    const { status, notes, isShortlisted } = req.body;
    const candidate = await prisma_1.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) {
        (0, response_1.sendError)(res, 'Candidate not found', 'NOT_FOUND', 404);
        return;
    }
    const oldStatus = candidate.status;
    const updated = await prisma_1.prisma.candidate.update({
        where: { id },
        data: { status, notes, isShortlisted },
    });
    if (status && status !== oldStatus) {
        await prisma_1.prisma.stageHistory.create({
            data: {
                candidateId: id,
                fromStatus: oldStatus,
                toStatus: status,
                changedBy: req.user.userId,
            },
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'PIPELINE_CHANGED',
                entityType: 'CANDIDATE',
                entityId: id,
                metadata: { from: oldStatus, to: status },
            },
        });
    }
    (0, response_1.sendSuccess)(res, updated, 'Candidate updated');
};
exports.updateCandidate = updateCandidate;
const shortlistCandidate = async (req, res) => {
    const id = req.params.id;
    const candidate = await prisma_1.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) {
        (0, response_1.sendError)(res, 'Candidate not found', 'NOT_FOUND', 404);
        return;
    }
    const updated = await prisma_1.prisma.candidate.update({
        where: { id },
        data: { isShortlisted: true, status: 'SHORTLISTED' },
    });
    await prisma_1.prisma.stageHistory.create({
        data: { candidateId: id, fromStatus: candidate.status, toStatus: 'SHORTLISTED', changedBy: req.user.userId },
    });
    await prisma_1.prisma.auditLog.create({
        data: { userId: req.user.userId, action: 'CANDIDATE_SHORTLISTED', entityType: 'CANDIDATE', entityId: id },
    });
    await prisma_1.prisma.notification.create({
        data: {
            userId: req.user.userId,
            type: 'CANDIDATE_SHORTLISTED',
            title: 'Candidate Shortlisted',
            message: `${candidate.firstName} ${candidate.lastName} has been shortlisted.`,
            entityId: id,
            entityType: 'CANDIDATE',
        },
    });
    (0, response_1.sendSuccess)(res, updated, 'Candidate shortlisted');
};
exports.shortlistCandidate = shortlistCandidate;
const rejectCandidate = async (req, res) => {
    const id = req.params.id;
    const { reason } = req.body;
    const candidate = await prisma_1.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) {
        (0, response_1.sendError)(res, 'Candidate not found', 'NOT_FOUND', 404);
        return;
    }
    const updated = await prisma_1.prisma.candidate.update({
        where: { id },
        data: { status: 'REJECTED', notes: reason },
    });
    await prisma_1.prisma.stageHistory.create({
        data: { candidateId: id, fromStatus: candidate.status, toStatus: 'REJECTED', changedBy: req.user.userId },
    });
    await prisma_1.prisma.auditLog.create({
        data: { userId: req.user.userId, action: 'CANDIDATE_REJECTED', entityType: 'CANDIDATE', entityId: id },
    });
    (0, response_1.sendSuccess)(res, updated, 'Candidate rejected');
};
exports.rejectCandidate = rejectCandidate;
const compareCandidates = async (req, res) => {
    const { candidateIds } = req.body;
    const candidates = await prisma_1.prisma.candidate.findMany({
        where: { id: { in: candidateIds } },
        include: {
            skills: true,
            experience: true,
            education: true,
            projects: true,
            certifications: true,
            screeningResult: true,
            job: { select: { title: true } },
        },
    });
    if (candidates.length !== candidateIds.length) {
        (0, response_1.sendError)(res, 'One or more candidates not found', 'NOT_FOUND', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, candidates, 'Candidates compared');
};
exports.compareCandidates = compareCandidates;
const addTag = async (req, res) => {
    const id = req.params.id;
    const { tag, color } = req.body;
    const result = await prisma_1.prisma.candidateTag.upsert({
        where: { candidateId_tag: { candidateId: id, tag } },
        create: { candidateId: id, tag, color },
        update: { color },
    });
    (0, response_1.sendSuccess)(res, result, 'Tag added');
};
exports.addTag = addTag;
const removeTag = async (req, res) => {
    const id = req.params.id;
    const tag = req.params.tag;
    await prisma_1.prisma.candidateTag.deleteMany({ where: { candidateId: id, tag } });
    (0, response_1.sendSuccess)(res, null, 'Tag removed');
};
exports.removeTag = removeTag;
const exportCandidates = async (req, res) => {
    const { jobId, format = 'json' } = req.query;
    const candidates = await prisma_1.prisma.candidate.findMany({
        where: { ...(jobId ? { jobId } : {}), NOT: { firstName: 'Processing' } },
        include: {
            skills: { where: { isMatched: true } },
            screeningResult: true,
            job: { select: { title: true } },
        },
        orderBy: { overallScore: 'desc' },
    });
    const data = candidates.map((c) => ({
        name: `${c.firstName} ${c.lastName}`,
        email: c.email || '',
        job: c.job.title,
        score: c.overallScore,
        category: c.matchCategory,
        status: c.status,
        skills: c.skills.map((s) => s.skill).join(', '),
        recommendation: c.aiRecommendation || '',
    }));
    if (format === 'csv') {
        const headers = Object.keys(data[0] || {}).join(',');
        const rows = data.map((row) => Object.values(row).map((v) => `"${v}"`).join(','));
        const csv = [headers, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=candidates.csv');
        res.send(csv);
        return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=candidates.json');
    res.json(data);
};
exports.exportCandidates = exportCandidates;
//# sourceMappingURL=candidates.controller.js.map