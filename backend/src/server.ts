import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { config } from './config';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { startResumeWorker, stopQueues } from './queue/resumeQueue';

async function main() {
  // Connect to database
  try {
    await prisma.$connect();
    logger.info('✓ Database connected');
  } catch (err) {
    logger.error('Failed to connect to database', { err });
    process.exit(1);
  }

  // Start background workers (Redis optional - gracefully degrade)
  try {
    startResumeWorker();
    logger.info('✓ Resume processing worker started');
  } catch (err) {
    logger.warn('Redis not available - background processing disabled', { err });
  }

  const server = app.listen(config.port, () => {
    logger.info(`✓ HireSense API running on port ${config.port} [${config.nodeEnv}]`);
    logger.info(`  Health: http://localhost:${config.port}/api/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — gracefully shutting down`);
    server.close(async () => {
      await stopQueues();
      await prisma.$disconnect();
      logger.info('Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
  });
}

main().catch((err) => {
  logger.error('Fatal startup error', { err });
  process.exit(1);
});
