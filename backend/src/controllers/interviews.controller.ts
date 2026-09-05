import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { getAIProvider } from '../ai';

export const generateInterviewQuestions = async (req: Request, res: Response): Promise<void> => {
  const { candidateId, jobId } = req.body;

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      resume: true,
      skills: true,
      experience: true,
      education: true,
      projects: true,
      job: true,
    },
  });

  if (!candidate) {
    sendError(res, 'Candidate not found', 'NOT_FOUND', 404);
    return;
  }

  const targetJobId = jobId || candidate.jobId;
  const job = await prisma.job.findUnique({ where: { id: targetJobId } });
  if (!job) {
    sendError(res, 'Job not found', 'NOT_FOUND', 404);
    return;
  }

  if (!candidate.resume?.rawText) {
    sendError(res, 'Resume has not been processed yet', 'RESUME_NOT_PROCESSED', 400);
    return;
  }

  const ai = getAIProvider();

  const parsedProfile = {
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email,
    phone: candidate.phone,
    location: candidate.location,
    professionalTitle: candidate.professionalTitle,
    summary: candidate.summary,
    yearsOfExperience: candidate.yearsOfExperience || 0,
    skills: candidate.skills.map((s) => ({ name: s.skill, proficiency: s.proficiency || undefined, yearsUsed: s.yearsUsed || undefined })),
    experience: candidate.experience.map((e) => ({
      company: e.company,
      title: e.title,
      location: e.location || undefined,
      startDate: e.startDate || undefined,
      endDate: e.endDate || undefined,
      isCurrent: e.isCurrent,
      description: e.description || undefined,
    })),
    education: [],
    projects: [],
    certifications: [],
    achievements: [],
    linkedinUrl: candidate.linkedinUrl,
    githubUrl: candidate.githubUrl,
    portfolioUrl: candidate.portfolioUrl,
  };

  const result = await ai.generateInterviewQuestions(parsedProfile, job.description);

  const interview = await prisma.interview.create({
    data: {
      candidateId,
      jobId: targetJobId,
      title: `Interview for ${job.title}`,
      totalQuestions: result.questions.length,
      questions: {
        create: result.questions.map((q) => ({
          category: q.category,
          question: q.question,
          whyItMatters: q.whyItMatters,
          expectedAnswer: q.expectedAnswer,
          evaluationCriteria: q.evaluationCriteria,
          difficulty: q.difficulty,
          orderIndex: q.orderIndex,
        })),
      },
    },
    include: { questions: { orderBy: { orderIndex: 'asc' } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: 'INTERVIEW_GENERATED',
      entityType: 'INTERVIEW',
      entityId: interview.id,
      metadata: { candidateId, jobId: targetJobId },
    },
  });

  sendSuccess(res, interview, 'Interview questions generated successfully', 201);
};

export const getInterview = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { orderIndex: 'asc' } },
      candidate: { select: { firstName: true, lastName: true, professionalTitle: true } },
    },
  });

  if (!interview) {
    sendError(res, 'Interview not found', 'NOT_FOUND', 404);
    return;
  }

  sendSuccess(res, interview);
};

export const getCandidateInterviews = async (req: Request, res: Response): Promise<void> => {
  const candidateId = req.params.candidateId as string;
  const interviews = await prisma.interview.findMany({
    where: { candidateId },
    include: { questions: { orderBy: { orderIndex: 'asc' } } },
    orderBy: { generatedAt: 'desc' },
  });
  sendSuccess(res, interviews);
};
