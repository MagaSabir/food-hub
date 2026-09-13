import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface HealthResult {
  status: 'ok' | 'error';
  db: 'up' | 'down';
  redis: 'up' | 'down';
  uptimeSec: number;
  timestamp: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthResult> {
    const [db, redis] = await Promise.all([this.checkDb(), this.checkRedis()]);

    return {
      status: db === 'up' && redis === 'up' ? 'ok' : 'error',
      db,
      redis,
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDb(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch (e) {
      this.logger.error('Health: БД недоступна', (e as Error).stack);
      return 'down';
    }
  }

  private async checkRedis(): Promise<'up' | 'down'> {
    const alive = await this.redis.isAlive();
    if (!alive) {
      this.logger.error('Health: Redis недоступен');
    }
    return alive ? 'up' : 'down';
  }
}
