"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResumeFile = validateResumeFile;
exports.extractTextFromFile = extractTextFromFile;
exports.sanitizeFilename = sanitizeFilename;
exports.ensureUploadDir = ensureUploadDir;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const logger_1 = require("../config/logger");
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
function validateResumeFile(mimetype, originalname, size) {
    const ext = path_1.default.extname(originalname).toLowerCase();
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
async function extractTextFromFile(filePath, mimeType) {
    try {
        const buffer = fs_1.default.readFileSync(filePath);
        if (mimeType === 'application/pdf') {
            const data = await (0, pdf_parse_1.default)(buffer);
            return data.text;
        }
        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth_1.default.extractRawText({ buffer });
            return result.value;
        }
        if (mimeType === 'text/plain') {
            return buffer.toString('utf-8');
        }
        throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
    catch (err) {
        logger_1.logger.error('Text extraction failed', { filePath, mimeType, err });
        throw new Error(`Failed to extract text from file: ${err.message}`);
    }
}
function sanitizeFilename(originalName) {
    const ext = path_1.default.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `resume_${timestamp}_${random}${ext}`;
}
function ensureUploadDir(uploadDir) {
    if (!fs_1.default.existsSync(uploadDir)) {
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
    }
}
//# sourceMappingURL=fileProcessor.js.map