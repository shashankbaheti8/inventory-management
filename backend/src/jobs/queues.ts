import { Queue } from 'bullmq';
import redis from '../config/redis';
import { logger } from '../config/logger';

// Low stock check queue
export const lowStockQueue = new Queue('low-stock-check', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Schedule recurring stock check every 30 minutes
export const scheduleLowStockCheck = async () => {
  // Remove existing repeatable jobs
  const repeatableJobs = await lowStockQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await lowStockQueue.removeRepeatableByKey(job.key);
  }

  await lowStockQueue.add(
    'check-low-stock',
    {},
    {
      repeat: { every: 30 * 60 * 1000 }, // Every 30 minutes
    }
  );

  logger.info('📋 Low stock check scheduled (every 30 minutes)');
};
