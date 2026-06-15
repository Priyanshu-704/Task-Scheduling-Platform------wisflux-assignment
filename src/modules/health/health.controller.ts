import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@ApiTags('Health & Monitoring')
@Controller('health')
export class HealthController {
  private readonly redisClient: Redis;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    const host = this.configService.get<string>('redis.host') || 'localhost';
    const port = this.configService.get<number>('redis.port') || 6379;
    const password = this.configService.get<string>('redis.password') || '';

    this.redisClient = new Redis({
      host,
      port,
      password: password || undefined,
      lazyConnect: true,
    });
  }

  @ApiOperation({ summary: 'Check system health status (Postgres & Redis)' })
  @Get()
  async check() {
    let dbStatus = 'up';
    let redisStatus = 'up';
    const errors: string[] = [];

    // Check Database
    try {
      await this.dataSource.query('SELECT 1');
    } catch (err) {
      dbStatus = 'down';
      errors.push(`Database connection failed: ${err.message}`);
    }

    // Check Redis
    try {
      await this.redisClient.connect();
      const ping = await this.redisClient.ping();
      if (ping !== 'PONG') {
        redisStatus = 'down';
        errors.push('Redis ping did not return PONG');
      }
      await this.redisClient.disconnect();
    } catch (err) {
      redisStatus = 'down';
      errors.push(`Redis connection failed: ${err.message}`);
    }

    const health = {
      status: dbStatus === 'up' && redisStatus === 'up' ? 'ok' : 'error',
      info: {
        database: { status: dbStatus },
        redis: { status: redisStatus },
      },
      timestamp: new Date().toISOString(),
    };

    if (health.status !== 'ok') {
      throw new ServiceUnavailableException(health);
    }

    return health;
  }

  @ApiOperation({ summary: 'Database-specific health check' })
  @Get('db')
  async checkDb() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', info: { database: { status: 'up' } } };
    } catch (err) {
      throw new ServiceUnavailableException({
        status: 'error',
        message: err.message,
      });
    }
  }

  @ApiOperation({ summary: 'Redis-specific health check' })
  @Get('redis')
  async checkRedis() {
    try {
      await this.redisClient.connect();
      await this.redisClient.ping();
      await this.redisClient.disconnect();
      return { status: 'ok', info: { redis: { status: 'up' } } };
    } catch (err) {
      throw new ServiceUnavailableException({
        status: 'error',
        message: err.message,
      });
    }
  }
}
