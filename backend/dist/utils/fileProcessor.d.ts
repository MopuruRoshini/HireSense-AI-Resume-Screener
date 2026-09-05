export interface FileValidationResult {
    valid: boolean;
    error?: string;
}
export declare function validateResumeFile(mimetype: string, originalname: string, size: number): FileValidationResult;
export declare function extractTextFromFile(filePath: string, mimeType: string): Promise<string>;
export declare function sanitizeFilename(originalName: string): string;
export declare function ensureUploadDir(uploadDir: string): void;
//# sourceMappingURL=fileProcessor.d.ts.map