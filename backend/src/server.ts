import app from './app';
import { config } from './config/index';
import { logger } from './config/logger';
import { initEmailTransporter } from './config/email';
import { scheduleLowStockCheck } from './jobs/queues';
import './jobs/worker'; // Start the worker

const start = async () => {
  try {
    // Initialize email transporter
    await initEmailTransporter();

    // Schedule background jobs
    await scheduleLowStockCheck();

    // Start server
    app.listen(config.port, () => {
      logger.info(`
╔══════════════════════════════════════════════════════════╗
║  Enterprise Inventory Management System                  ║
║  Environment: ${config.nodeEnv.padEnd(41)}║
║  Port: ${String(config.port).padEnd(48)}║
║  API: http://localhost:${config.port}/api                       ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

start();
