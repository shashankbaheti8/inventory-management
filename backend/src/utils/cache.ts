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

  /**
   * Deletes keys matching a pattern using SCAN, which walks the keyspace in
   * small batches instead of blocking Redis the way KEYS does.
   */
  static async delPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      let deleted = 0;
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
        cursor = next;
        if (keys.length > 0) {
          deleted += await redis.del(...keys);
        }
      } while (cursor !== '0');
      if (deleted > 0) {
        logger.debug(`Cache: Deleted ${deleted} keys matching "${pattern}"`);
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
