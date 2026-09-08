import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;
  constructor(url: string) {
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 30_000,
    });

    this.client.on('error', (err: Error) =>
      this.logger.error(`Redis: connection error: ${err.message}`),
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      this.logger.log('Redis is connected');
    } catch (e) {
      this.logger.error(`Redis connection error: ${(e as Error).message}`);
      throw e;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async isAlive(): Promise<boolean> {
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
