import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('redis.host') || 'localhost';
    const port = this.configService.get<number>('redis.port') || 6379;
    const password = this.configService.get<string>('redis.password') || '';

    this.redisClient = new Redis({
      host,
      port,
      password: password || undefined,
      maxRetriesPerRequest: null, // Essential for BullMQ compatibility if sharing connection
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis connected successfully for caching');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis cache connection error:', err);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(`Error reading key ${key} from Redis cache:`, error);
      return null; // Fallback to DB (Cache Aside)
    }
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    try {
      const data = JSON.stringify(value);
      await this.redisClient.setex(key, ttlSeconds, data);
    } catch (error) {
      this.logger.error(`Error writing key ${key} to Redis cache:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from Redis cache:`, error);
    }
  }

  // Scan and delete keys matching a pattern (e.g., "workspace:*:projects")
  async delPattern(pattern: string): Promise<void> {
    try {
      const stream = this.redisClient.scanStream({
        match: pattern,
        count: 100,
      });

      for await (const resultKeys of stream) {
        if (resultKeys.length > 0) {
          await this.redisClient.del(...resultKeys);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error deleting pattern ${pattern} from Redis cache:`,
        error,
      );
    }
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }
}
