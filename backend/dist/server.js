"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const logger_1 = require("./config/logger");
const prisma_1 = require("./config/prisma");
const resumeQueue_1 = require("./queue/resumeQueue");
async function main() {
    // Connect to database
    try {
        await prisma_1.prisma.$connect();
        logger_1.logger.info('✓ Database connected');
    }
    catch (err) {
        logger_1.logger.error('Failed to connect to database', { err });
        process.exit(1);
    }
    // Start background workers (Redis optional - gracefully degrade)
    try {
        (0, resumeQueue_1.startResumeWorker)();
        logger_1.logger.info('✓ Resume processing worker started');
    }
    catch (err) {
        logger_1.logger.warn('Redis not available - background processing disabled', { err });
    }
    const server = app_1.default.listen(config_1.config.port, () => {
        logger_1.logger.info(`✓ HireSense API running on port ${config_1.config.port} [${config_1.config.nodeEnv}]`);
        logger_1.logger.info(`  Health: http://localhost:${config_1.config.port}/api/health`);
    });
    // Graceful shutdown
    const shutdown = async (signal) => {
        logger_1.logger.info(`${signal} received — gracefully shutting down`);
        server.close(async () => {
            await (0, resumeQueue_1.stopQueues)();
            await prisma_1.prisma.$disconnect();
            logger_1.logger.info('Shutdown complete');
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error('Unhandled rejection', { reason });
    });
}
main().catch((err) => {
    logger_1.logger.error('Fatal startup error', { err });
    process.exit(1);
});
//# sourceMappingURL=server.js.map