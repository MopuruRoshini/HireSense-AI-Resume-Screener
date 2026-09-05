"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamProgress = exports.getResume = exports.uploadResumes = exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const prisma_1 = require("../config/prisma");
const config_1 = require("../config");
const response_1 = require("../utils/response");
const fileProcessor_1 = require("../utils/fileProcessor");
const resumeQueue_1 = require("../queue/resumeQueue");
(0, fileProcessor_1.ensureUploadDir)(config_1.config.uploadDir);
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, config_1.config.uploadDir),
    filename: (_req, file, cb) => cb(null, (0, fileProcessor_1.sanitizeFilename)(file.originalname)),
});
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: { fileSize: config_1.config.maxFileSize, files: 100 },
    fileFilter: (_req, file, cb) => {
        const result = (0, fileProcessor_1.validateResumeFile)(file.mimetype, file.originalname, 0);
        if (!result.valid) {
            cb(new Error(result.error || 'Invalid file'));
        }
        else {
            cb(null, true);
        }
    },
}).array('resumes', 100);
const uploadResumes = async (req, res) => {
    const { jobId } = req.body;
    if (!jobId) {
        (0, response_1.sendError)(res, 'jobId is required', 'MISSING_JOB_ID', 400);
        return;
    }
    const job = await prisma_1.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
        (0, response_1.sendError)(res, 'Job not found', 'NOT_FOUND', 404);
        return;
    }
    const files = req.files;
    if (!files || files.length === 0) {
        (0, response_1.sendError)(res, 'No files uploaded', 'NO_FILES', 400);
        return;
    }
    const batchId = (0, uuid_1.v4)();
    const createdCandidates = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = (0, fileProcessor_1.validateResumeFile)(file.mimetype, file.originalname, file.size);
        if (!validation.valid)
            continue;
        // Create resume record
        const resume = await prisma_1.prisma.resume.create({
            data: {
                originalName: file.originalname,
                storedName: file.filename,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                filePath: path_1.default.join(config_1.config.uploadDir, file.filename),
                status: 'UPLOADED',
            },
        });
        // Create placeholder candidate
        const candidate = await prisma_1.prisma.candidate.create({
            data: {
                resumeId: resume.id,
                jobId,
                firstName: 'Processing',
                lastName: '...',
                status: 'APPLIED',
            },
        });
        createdCandidates.push({ resumeId: resume.id, candidateId: candidate.id });
        // Queue for processing
        await (0, resumeQueue_1.queueResume)({
            resumeId: resume.id,
            candidateId: candidate.id,
            jobId,
            filePath: path_1.default.join(config_1.config.uploadDir, file.filename),
            mimeType: file.mimetype,
            batchId,
            totalInBatch: files.length,
            indexInBatch: i,
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'RESUME_UPLOADED',
                entityType: 'RESUME',
                entityId: resume.id,
                metadata: { jobId, filename: file.originalname, size: file.size },
            },
        });
    }
    (0, response_1.sendSuccess)(res, {
        batchId,
        total: files.length,
        queued: createdCandidates.length,
        candidates: createdCandidates,
    }, `${createdCandidates.length} resume(s) uploaded and queued for processing`, 202);
};
exports.uploadResumes = uploadResumes;
const getResume = async (req, res) => {
    const id = req.params.id;
    const resume = await prisma_1.prisma.resume.findUnique({ where: { id } });
    if (!resume) {
        (0, response_1.sendError)(res, 'Resume not found', 'NOT_FOUND', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, resume);
};
exports.getResume = getResume;
// SSE endpoint for real-time progress
const streamProgress = (req, res) => {
    const batchId = req.params.batchId;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', config_1.config.frontendUrl);
    res.flushHeaders();
    const send = (data) => {
        res.write(data);
    };
    if (!resumeQueue_1.sseClients.has(batchId)) {
        resumeQueue_1.sseClients.set(batchId, new Set());
    }
    resumeQueue_1.sseClients.get(batchId).add(send);
    // Heartbeat
    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 30000);
    req.on('close', () => {
        clearInterval(heartbeat);
        resumeQueue_1.sseClients.get(batchId)?.delete(send);
        if (resumeQueue_1.sseClients.get(batchId)?.size === 0) {
            resumeQueue_1.sseClients.delete(batchId);
        }
    });
};
exports.streamProgress = streamProgress;
//# sourceMappingURL=resumes.controller.js.map