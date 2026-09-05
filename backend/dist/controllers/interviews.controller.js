"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCandidateInterviews = exports.getInterview = exports.generateInterviewQuestions = void 0;
const prisma_1 = require("../config/prisma");
const response_1 = require("../utils/response");
const ai_1 = require("../ai");
const generateInterviewQuestions = async (req, res) => {
    const { candidateId, jobId } = req.body;
    const candidate = await prisma_1.prisma.candidate.findUnique({
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
        (0, response_1.sendError)(res, 'Candidate not found', 'NOT_FOUND', 404);
        return;
    }
    const targetJobId = jobId || candidate.jobId;
    const job = await prisma_1.prisma.job.findUnique({ where: { id: targetJobId } });
    if (!job) {
        (0, response_1.sendError)(res, 'Job not found', 'NOT_FOUND', 404);
        return;
    }
    if (!candidate.resume?.rawText) {
        (0, response_1.sendError)(res, 'Resume has not been processed yet', 'RESUME_NOT_PROCESSED', 400);
        return;
    }
    const ai = (0, ai_1.getAIProvider)();
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
    const interview = await prisma_1.prisma.interview.create({
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
    await prisma_1.prisma.auditLog.create({
        data: {
            userId: req.user.userId,
            action: 'INTERVIEW_GENERATED',
            entityType: 'INTERVIEW',
            entityId: interview.id,
            metadata: { candidateId, jobId: targetJobId },
        },
    });
    (0, response_1.sendSuccess)(res, interview, 'Interview questions generated successfully', 201);
};
exports.generateInterviewQuestions = generateInterviewQuestions;
const getInterview = async (req, res) => {
    const id = req.params.id;
    const interview = await prisma_1.prisma.interview.findUnique({
        where: { id },
        include: {
            questions: { orderBy: { orderIndex: 'asc' } },
            candidate: { select: { firstName: true, lastName: true, professionalTitle: true } },
        },
    });
    if (!interview) {
        (0, response_1.sendError)(res, 'Interview not found', 'NOT_FOUND', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, interview);
};
exports.getInterview = getInterview;
const getCandidateInterviews = async (req, res) => {
    const candidateId = req.params.candidateId;
    const interviews = await prisma_1.prisma.interview.findMany({
        where: { candidateId },
        include: { questions: { orderBy: { orderIndex: 'asc' } } },
        orderBy: { generatedAt: 'desc' },
    });
    (0, response_1.sendSuccess)(res, interviews);
};
exports.getCandidateInterviews = getCandidateInterviews;
//# sourceMappingURL=interviews.controller.js.map