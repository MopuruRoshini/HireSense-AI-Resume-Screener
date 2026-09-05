"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.getConversation = exports.getConversations = exports.chat = void 0;
const prisma_1 = require("../config/prisma");
const response_1 = require("../utils/response");
const ai_1 = require("../ai");
const chat = async (req, res) => {
    const { message, conversationId } = req.body;
    const userId = req.user.userId;
    // Get or create conversation
    let conversation;
    if (conversationId) {
        conversation = await prisma_1.prisma.aIConversation.findUnique({
            where: { id: conversationId },
            include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
        });
        if (!conversation || conversation.userId !== userId) {
            (0, response_1.sendError)(res, 'Conversation not found', 'NOT_FOUND', 404);
            return;
        }
    }
    else {
        conversation = await prisma_1.prisma.aIConversation.create({
            data: { userId, title: message.substring(0, 50) },
            include: { messages: true },
        });
    }
    // Build context from real data
    const [recentCandidates, recentJobs] = await Promise.all([
        prisma_1.prisma.candidate.findMany({
            where: { NOT: { firstName: 'Processing' }, overallScore: { not: null } },
            orderBy: { overallScore: 'desc' },
            take: 20,
            include: { job: { select: { title: true } } },
        }),
        prisma_1.prisma.job.findMany({
            where: { status: 'ACTIVE', ...(req.user.organizationId ? { organizationId: req.user.organizationId } : {}) },
            take: 10,
            include: { _count: { select: { candidates: true } } },
        }),
    ]);
    const ai = (0, ai_1.getAIProvider)();
    const response = await ai.copilotChat(message, {
        userId,
        organizationId: req.user.organizationId,
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
    await prisma_1.prisma.aIMessage.createMany({
        data: [
            { conversationId: conversation.id, role: 'USER', content: message },
            { conversationId: conversation.id, role: 'ASSISTANT', content: response },
        ],
    });
    await prisma_1.prisma.auditLog.create({
        data: { userId, action: 'COPILOT_QUERIED', entityType: 'CONVERSATION', entityId: conversation.id },
    });
    (0, response_1.sendSuccess)(res, {
        conversationId: conversation.id,
        message: response,
        role: 'ASSISTANT',
    });
};
exports.chat = chat;
const getConversations = async (req, res) => {
    const conversations = await prisma_1.prisma.aIConversation.findMany({
        where: { userId: req.user.userId },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            _count: { select: { messages: true } },
        },
    });
    (0, response_1.sendSuccess)(res, conversations);
};
exports.getConversations = getConversations;
const getConversation = async (req, res) => {
    const id = req.params.id;
    const conversation = await prisma_1.prisma.aIConversation.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation || conversation.userId !== req.user.userId) {
        (0, response_1.sendError)(res, 'Conversation not found', 'NOT_FOUND', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, conversation);
};
exports.getConversation = getConversation;
const deleteConversation = async (req, res) => {
    const id = req.params.id;
    await prisma_1.prisma.aIConversation.deleteMany({
        where: { id, userId: req.user.userId },
    });
    (0, response_1.sendSuccess)(res, null, 'Conversation deleted');
};
exports.deleteConversation = deleteConversation;
//# sourceMappingURL=copilot.controller.js.map