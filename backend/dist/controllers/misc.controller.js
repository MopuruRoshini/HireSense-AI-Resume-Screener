"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.analyzeResumeQuality = exports.markAllRead = exports.markRead = exports.getNotifications = void 0;
const prisma_1 = require("../config/prisma");
const response_1 = require("../utils/response");
const ai_1 = require("../ai");
const getNotifications = async (req, res) => {
    const { unreadOnly } = req.query;
    const notifications = await prisma_1.prisma.notification.findMany({
        where: {
            userId: req.user.userId,
            ...(unreadOnly === 'true' ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    (0, response_1.sendSuccess)(res, notifications);
};
exports.getNotifications = getNotifications;
const markRead = async (req, res) => {
    const id = req.params.id;
    await prisma_1.prisma.notification.updateMany({
        where: { id, userId: req.user.userId },
        data: { isRead: true },
    });
    (0, response_1.sendSuccess)(res, null, 'Notification marked as read');
};
exports.markRead = markRead;
const markAllRead = async (req, res) => {
    await prisma_1.prisma.notification.updateMany({
        where: { userId: req.user.userId, isRead: false },
        data: { isRead: true },
    });
    (0, response_1.sendSuccess)(res, null, 'All notifications marked as read');
};
exports.markAllRead = markAllRead;
const analyzeResumeQuality = async (req, res) => {
    const { resumeId, text } = req.body;
    let resumeText = text;
    if (resumeId) {
        const resume = await prisma_1.prisma.resume.findUnique({ where: { id: resumeId } });
        resumeText = resume?.rawText || '';
    }
    if (!resumeText) {
        (0, response_1.sendSuccess)(res, null, 'No resume text available');
        return;
    }
    const ai = (0, ai_1.getAIProvider)();
    const result = await ai.analyzeResumeQuality(resumeText);
    (0, response_1.sendSuccess)(res, result);
};
exports.analyzeResumeQuality = analyzeResumeQuality;
const getAuditLogs = async (req, res) => {
    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const logs = await prisma_1.prisma.auditLog.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    const total = await prisma_1.prisma.auditLog.count({ where: { userId: req.user.userId } });
    (0, response_1.sendSuccess)(res, { logs, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
};
exports.getAuditLogs = getAuditLogs;
//# sourceMappingURL=misc.controller.js.map