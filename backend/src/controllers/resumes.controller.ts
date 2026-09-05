import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/prisma';
import { config } from '../config';
import { sendSuccess, sendError } from '../utils/response';
import { validateResumeFile, sanitizeFilename, ensureUploadDir } from '../utils/fileProcessor';
import { queueResume, sseClients } from '../queue/resumeQueue';

ensureUploadDir(config.uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => cb(null, sanitizeFilename(file.originalname)),
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: config.maxFileSize, files: 100 },
  fileFilter: (_req, file, cb) => {
    const result = validateResumeFile(file.mimetype, file.originalname, 0);
    if (!result.valid) {
      cb(new Error(result.error || 'Invalid file'));
    } else {
      cb(null, true);
    }
  },
}).array('resumes', 100);

export const uploadResumes = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.body;

  if (!jobId) {
    sendError(res, 'jobId is required', 'MISSING_JOB_ID', 400);
    return;
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    sendError(res, 'Job not found', 'NOT_FOUND', 404);
    return;
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    sendError(res, 'No files uploaded', 'NO_FILES', 400);
    return;
  }

  const batchId = uuidv4();
  const createdCandidates: { resumeId: string; candidateId: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const validation = validateResumeFile(file.mimetype, file.originalname, file.size);
    if (!validation.valid) continue;

    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        filePath: path.join(config.uploadDir, file.filename),
        status: 'UPLOADED',
      },
    });

    // Create placeholder candidate
    const candidate = await prisma.candidate.create({
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
    await queueResume({
      resumeId: resume.id,
      candidateId: candidate.id,
      jobId,
      filePath: path.join(config.uploadDir, file.filename),
      mimeType: file.mimetype,
      batchId,
      totalInBatch: files.length,
      indexInBatch: i,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'RESUME_UPLOADED',
        entityType: 'RESUME',
        entityId: resume.id,
        metadata: { jobId, filename: file.originalname, size: file.size },
      },
    });
  }

  sendSuccess(res, {
    batchId,
    total: files.length,
    queued: createdCandidates.length,
    candidates: createdCandidates,
  }, `${createdCandidates.length} resume(s) uploaded and queued for processing`, 202);
};

export const getResume = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume) {
    sendError(res, 'Resume not found', 'NOT_FOUND', 404);
    return;
  }
  sendSuccess(res, resume);
};

// SSE endpoint for real-time progress
export const streamProgress = (req: Request, res: Response): void => {
  const batchId = req.params.batchId as string;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', config.frontendUrl);
  res.flushHeaders();

  const send = (data: string) => {
    res.write(data);
  };

  if (!sseClients.has(batchId)) {
    sseClients.set(batchId, new Set());
  }
  sseClients.get(batchId)!.add(send);

  // Heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.get(batchId)?.delete(send);
    if (sseClients.get(batchId)?.size === 0) {
      sseClients.delete(batchId);
    }
  });
};
