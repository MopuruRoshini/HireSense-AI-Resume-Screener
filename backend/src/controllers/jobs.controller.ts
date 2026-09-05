import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { getAIProvider } from '../ai';

export const getJobs = async (req: Request, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status, search } = req.query as Record<string, string>;
  const orgId = req.user!.organizationId;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where = {
    ...(orgId ? { organizationId: orgId } : {}),
    ...(status ? { status: status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ARCHIVED' } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { department: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
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
    prisma.job.count({ where }),
  ]);

  const jobsWithStats = await Promise.all(
    jobs.map(async (job) => {
      const avgScore = await prisma.candidate.aggregate({
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
    })
  );

  sendPaginated(res, jobsWithStats, total, pageNum, limitNum);
};

export const getJob = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      skills: true,
      createdBy: { select: { firstName: true, lastName: true, email: true } },
      _count: { select: { candidates: true, screeningResults: true } },
    },
  });

  if (!job) {
    sendError(res, 'Job not found', 'NOT_FOUND', 404);
    return;
  }

  const stats = await prisma.candidate.groupBy({
    by: ['status'],
    where: { jobId: id },
    _count: { status: true },
  });

  sendSuccess(res, { ...job, stats });
};

export const createJob = async (req: Request, res: Response): Promise<void> => {
  const orgId = req.user!.organizationId;
  if (!orgId) {
    sendError(res, 'Organization required — user must belong to an organization', 'ORG_REQUIRED', 400);
    return;
  }

  const body = req.body;

  // Normalize salary field aliases: frontend may send minSalary/maxSalary/currency
  // Backend DB uses salaryMin/salaryMax/salaryCurrency
  const salaryMin = body.salaryMin ?? body.minSalary ?? undefined;
  const salaryMax = body.salaryMax ?? body.maxSalary ?? undefined;
  const salaryCurrency = body.salaryCurrency ?? body.currency ?? 'USD';

  const {
    title, department, location, locationType, employmentType,
    experienceMin, experienceMax,
    description, requirements, responsibilities, benefits,
    openings, status,
  } = body;

  const job = await prisma.job.create({
    data: {
      title,
      department,
      location,
      locationType,
      employmentType,
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      salaryCurrency,
      description,
      requirements,
      responsibilities,
      benefits,
      openings: openings ?? 1,
      status: status ?? 'DRAFT',
      organizationId: orgId,
      createdById: req.user!.userId,
    },
    include: { skills: true },
  });

  // Trigger AI JD analysis in background (non-blocking)
  analyzeJobInBackground(job.id, description).catch(() => {});

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'JOB_CREATED', entityType: 'JOB', entityId: job.id },
  });

  await prisma.analyticsEvent.create({
    data: { event: 'JOB_CREATED', entityId: job.id, entityType: 'JOB', orgId },
  });

  sendSuccess(res, job, 'Job created successfully', 201);
};

export const updateJob = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    sendError(res, 'Job not found', 'NOT_FOUND', 404);
    return;
  }

  const body = req.body;
  // Normalize aliases on update too
  const updateData = { ...body };
  if (body.minSalary !== undefined && body.salaryMin === undefined) updateData.salaryMin = body.minSalary;
  if (body.maxSalary !== undefined && body.salaryMax === undefined) updateData.salaryMax = body.maxSalary;
  if (body.currency !== undefined && body.salaryCurrency === undefined) updateData.salaryCurrency = body.currency;
  delete updateData.minSalary;
  delete updateData.maxSalary;
  delete updateData.currency;

  const updated = await prisma.job.update({
    where: { id },
    data: updateData,
    include: { skills: true },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'JOB_UPDATED', entityType: 'JOB', entityId: id },
  });

  sendSuccess(res, updated, 'Job updated successfully');
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    sendError(res, 'Job not found', 'NOT_FOUND', 404);
    return;
  }

  await prisma.job.update({ where: { id }, data: { status: 'ARCHIVED' } });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'JOB_DELETED', entityType: 'JOB', entityId: id },
  });

  sendSuccess(res, null, 'Job archived successfully');
};

export const analyzeJobDescription = async (req: Request, res: Response): Promise<void> => {
  const { jobId, description: rawDescription } = req.body;

  let descriptionToAnalyze: string;

  if (jobId) {
    // Analyze from a saved job record
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      sendError(res, 'Job not found', 'NOT_FOUND', 404);
      return;
    }
    descriptionToAnalyze = job.description;
  } else if (rawDescription) {
    // Analyze raw description text (pre-creation, used from the create modal)
    descriptionToAnalyze = rawDescription;
  } else {
    sendError(res, 'Provide either jobId or description', 'VALIDATION_ERROR', 400);
    return;
  }

  const ai = getAIProvider();
  const analysis = await ai.analyzeJobDescription(descriptionToAnalyze);

  // Only store extracted skills if we have a real job record
  if (jobId) {
    await prisma.jobSkill.deleteMany({ where: { jobId } });
    if (analysis.requiredSkills.length > 0) {
      await prisma.jobSkill.createMany({
        data: analysis.requiredSkills.map((skill) => ({ jobId, skill, isRequired: true })),
        skipDuplicates: true,
      });
    }
    if (analysis.preferredSkills.length > 0) {
      await prisma.jobSkill.createMany({
        data: analysis.preferredSkills.map((skill) => ({ jobId, skill, isRequired: false })),
        skipDuplicates: true,
      });
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { aiAnalyzed: true, aiSummary: analysis.summary, seniority: analysis.seniority, domain: analysis.domain },
    });
  }

  sendSuccess(res, analysis, 'Job description analyzed successfully');
};

async function analyzeJobInBackground(jobId: string, description: string): Promise<void> {
  const ai = getAIProvider();
  const analysis = await ai.analyzeJobDescription(description);

  await prisma.jobSkill.createMany({
    data: [
      ...analysis.requiredSkills.map((skill) => ({ jobId, skill, isRequired: true })),
      ...analysis.preferredSkills.map((skill) => ({ jobId, skill, isRequired: false })),
    ],
    skipDuplicates: true,
  });

  await prisma.job.update({
    where: { id: jobId },
    data: { aiAnalyzed: true, aiSummary: analysis.summary, seniority: analysis.seniority, domain: analysis.domain },
  });
}
