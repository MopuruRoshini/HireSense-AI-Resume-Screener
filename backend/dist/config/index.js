"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'hiresense-dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    ai: {
        provider: process.env.AI_PROVIDER || 'gemini',
        apiKey: process.env.AI_API_KEY || '',
        model: process.env.AI_MODEL || 'gemini-1.5-flash',
    },
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    rateLimitWindowMs: 15 * 60 * 1000,
    rateLimitMax: 200,
};
//# sourceMappingURL=index.js.map