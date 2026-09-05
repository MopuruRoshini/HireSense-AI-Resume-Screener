import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { CandidateStatus } from '@prisma/client';

export const getCandidates = async (req: Request, res: Response): Promise<void> => {
  const {
    page = '1', limit = '20', jobId, status, search, minScore, maxScore, sortBy = 'overallScore', sortOrder = 'desc',
  } = req.query as Record<string, string>;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};
  if (jobId) where.jobId = jobId;
  if (status) where.status = status as CandidateStatus;
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

  const orderBy: Record<string, string> = {};
  if (sortBy === 'overallScore') orderBy.overallScore = sortOrder;
  else if (sortBy === 'name') orderBy.firstName = sortOrder;
  else if (sortBy === 'createdAt') orderBy.createdAt = sortOrder;
  else orderBy.overallScore = 'desc';

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
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
    prisma.candidate.count({ where }),
  ]);

  sendPaginated(res, candidates, total, pageNum, limitNum);
};

export const getCandidate = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const candidate = await prisma.candidate.findUnique({
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
    sendError(res, 'Candidate not found', 'NOT_FOUND', 404);
    return;
  }

  sendSuccess(res, candidate);
};

export const updateCandidate = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { status, notes, isShortlisted } = req.body;

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) {
    sendError(res, 'Candidate not found', 'NOT_FOUND', 404);
    return;
  }

  const oldStatus = candidate.status;

  const updated = await prisma.candidate.update({
    where: { id },
    data: { status, notes, isShortlisted },
  });

  if (status && status !== oldStatus) {
    await prisma.stageHistory.create({
      data: {
        candidateId: id,
        fromStatus: oldStatus,
        toStatus: status as CandidateStatus,
        changedBy: req.user!.userId,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'PIPELINE_CHANGED',
        entityType: 'CANDIDATE',
        entityId: id,
        metadata: { from: oldStatus, to: status },
      },
    });
  }

  sendSuccess(res, updated, 'Candidate updated');
};

export const shortlistCandidate = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) {
    sendError(res, 'Candidate not found', 'NOT_FOUND', 404);
    return;
  }

  const updated = await prisma.candidate.update({
    where: { id },
    data: { isShortlisted: true, status: 'SHORTLISTED' },
  });

  await prisma.stageHistory.create({
    data: { candidateId: id, fromStatus: candidate.status, toStatus: 'SHORTLISTED', changedBy: req.user!.userId },
  });
  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'CANDIDATE_SHORTLISTED', entityType: 'CANDIDATE', entityId: id },
  });
  await prisma.notification.create({
    data: {
      userId: req.user!.userId,
      type: 'CANDIDATE_SHORTLISTED',
      title: 'Candidate Shortlisted',
      message: `${candidate.firstName} ${candidate.lastName} has been shortlisted.`,
      entityId: id,
      entityType: 'CANDIDATE',
    },
  });

  sendSuccess(res, updated, 'Candidate shortlisted');
};

export const rejectCandidate = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) {
    sendError(res, 'Candidate not found', 'NOT_FOUND', 404);
    return;
  }

  const updated = await prisma.candidate.update({
    where: { id },
    data: { status: 'REJECTED', notes: reason },
  });

  await prisma.stageHistory.create({
    data: { candidateId: id, fromStatus: candidate.status, toStatus: 'REJECTED', changedBy: req.user!.userId },
  });
  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'CANDIDATE_REJECTED', entityType: 'CANDIDATE', entityId: id },
  });

  sendSuccess(res, updated, 'Candidate rejected');
};

export const compareCandidates = async (req: Request, res: Response): Promise<void> => {
  const { candidateIds } = req.body;

  const candidates = await prisma.candidate.findMany({
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
    sendError(res, 'One or more candidates not found', 'NOT_FOUND', 404);
    return;
  }

  sendSuccess(res, candidates, 'Candidates compared');
};

export const addTag = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { tag, color } = req.body;

  const result = await prisma.candidateTag.upsert({
    where: { candidateId_tag: { candidateId: id, tag } },
    create: { candidateId: id, tag, color },
    update: { color },
  });

  sendSuccess(res, result, 'Tag added');
};

export const removeTag = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const tag = req.params.tag as string;

  await prisma.candidateTag.deleteMany({ where: { candidateId: id, tag } });

  sendSuccess(res, null, 'Tag removed');
};

export const exportCandidates = async (req: Request, res: Response): Promise<void> => {
  const { jobId, format = 'json' } = req.query as Record<string, string>;

  const candidates = await prisma.candidate.findMany({
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
