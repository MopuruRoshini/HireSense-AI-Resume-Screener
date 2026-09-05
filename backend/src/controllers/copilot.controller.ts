import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { getAIProvider } from '../ai';

export const chat = async (req: Request, res: Response): Promise<void> => {
  const { message, conversationId } = req.body;
  const userId = req.user!.userId;

  // Get or create conversation
  let conversation;
  if (conversationId) {
    conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
    });
    if (!conversation || conversation.userId !== userId) {
      sendError(res, 'Conversation not found', 'NOT_FOUND', 404);
      return;
    }
  } else {
    conversation = await prisma.aIConversation.create({
      data: { userId, title: message.substring(0, 50) },
      include: { messages: true },
    });
  }

  // Build context from real data
  const [recentCandidates, recentJobs] = await Promise.all([
    prisma.candidate.findMany({
      where: { NOT: { firstName: 'Processing' }, overallScore: { not: null } },
      orderBy: { overallScore: 'desc' },
      take: 20,
      include: { job: { select: { title: true } } },
    }),
    prisma.job.findMany({
      where: { status: 'ACTIVE', ...(req.user!.organizationId ? { organizationId: req.user!.organizationId } : {}) },
      take: 10,
      include: { _count: { select: { candidates: true } } },
    }),
  ]);

  const ai = getAIProvider();
  const response = await ai.copilotChat(message, {
    userId,
    organizationId: req.user!.organizationId,
    recentCandidates: recentCandidates.map((c) => ({
      name: `${c.firstName} ${c.lastName}`,
      score: c.overallScore || 0,
      job: c.job.title,
    })),
    recentJobs: recentJobs.map((j) => ({
      title: j.title,
      candidateCount: j._count.candidates,
    })),
    conversationHistory: conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  // Save messages
  await prisma.aIMessage.createMany({
    data: [
      { conversationId: conversation.id, role: 'USER', content: message },
      { conversationId: conversation.id, role: 'ASSISTANT', content: response },
    ],
  });

  await prisma.auditLog.create({
    data: { userId, action: 'COPILOT_QUERIED', entityType: 'CONVERSATION', entityId: conversation.id },
  });

  sendSuccess(res, {
    conversationId: conversation.id,
    message: response,
    role: 'ASSISTANT',
  });
};

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  const conversations = await prisma.aIConversation.findMany({
    where: { userId: req.user!.userId },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: true } },
    },
  });
  sendSuccess(res, conversations);
};

export const getConversation = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const conversation = await prisma.aIConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conversation || conversation.userId !== req.user!.userId) {
    sendError(res, 'Conversation not found', 'NOT_FOUND', 404);
    return;
  }
  sendSuccess(res, conversation);
};

export const deleteConversation = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await prisma.aIConversation.deleteMany({
    where: { id, userId: req.user!.userId },
  });
  sendSuccess(res, null, 'Conversation deleted');
};
