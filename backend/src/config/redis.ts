import Redis from 'ioredis';
import { config } from './index';
import { logger } from './logger';

const isRedissTLS = config.redis.url.startsWith('rediss://');

const redis = new Redis(config.redis.url, {
  tls: isRedissTLS ? {} : undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err: Error) => {
  logger.error('❌ Redis error:', err.message);
});

export default redis;
