import redis from '../config/redis';
import { logger } from '../config/logger';

const DEFAULT_TTL = 300; // 5 minutes

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Cache GET error for key "${key}":`, error);
      return null;
    }
  }

  static async set(key: string, data: unknown, ttl = DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error(`Cache SET error for key "${key}":`, error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Cache DEL error for key "${key}":`, error);
    }
  }

  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug(`Cache: Deleted ${keys.length} keys matching "${pattern}"`);
      }
    } catch (error) {
      logger.error(`Cache DEL pattern error for "${pattern}":`, error);
    }
  }

  static async flush(): Promise<void> {
    try {
      await redis.flushdb();
      logger.info('Cache: Flushed entire database');
    } catch (error) {
      logger.error('Cache FLUSH error:', error);
    }
  }
}
