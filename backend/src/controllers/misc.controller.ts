import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { getAIProvider } from '../ai';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  const { unreadOnly } = req.query;
  const notifications = await prisma.notification.findMany({
    where: {
      userId: req.user!.userId,
      ...(unreadOnly === 'true' ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  sendSuccess(res, notifications);
};

export const markRead = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await prisma.notification.updateMany({
    where: { id, userId: req.user!.userId },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'Notification marked as read');
};

export const markAllRead = async (req: Request, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'All notifications marked as read');
};

export const analyzeResumeQuality = async (req: Request, res: Response): Promise<void> => {
  const { resumeId, text } = req.body;

  let resumeText = text;
  if (resumeId) {
    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    resumeText = resume?.rawText || '';
  }

  if (!resumeText) {
    sendSuccess(res, null, 'No resume text available');
    return;
  }

  const ai = getAIProvider();
  const result = await ai.analyzeResumeQuality(resumeText);
  sendSuccess(res, result);
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  const { page = '1', limit = '50' } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  const logs = await prisma.auditLog.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  const total = await prisma.auditLog.count({ where: { userId: req.user!.userId } });

  sendSuccess(res, { logs, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
};
