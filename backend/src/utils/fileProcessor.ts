import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from '../config/logger';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateResumeFile(
  mimetype: string,
  originalname: string,
  size: number
): FileValidationResult {
  const ext = path.extname(originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Unsupported file extension. Allowed: PDF, DOCX, TXT` };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    return { valid: false, error: `Invalid file type. Allowed: PDF, DOCX, TXT` };
  }

  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size: 10MB` };
  }

  return { valid: true };
}

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  try {
    const buffer = fs.readFileSync(filePath);

    if (mimeType === 'application/pdf') {
      const data = await pdf(buffer);
      return data.text;
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (mimeType === 'text/plain') {
      return buffer.toString('utf-8');
    }

    throw new Error(`Unsupported MIME type: ${mimeType}`);
  } catch (err) {
    logger.error('Text extraction failed', { filePath, mimeType, err });
    throw new Error(`Failed to extract text from file: ${(err as Error).message}`);
  }
}

export function sanitizeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `resume_${timestamp}_${random}${ext}`;
}

export function ensureUploadDir(uploadDir: string): void {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}
