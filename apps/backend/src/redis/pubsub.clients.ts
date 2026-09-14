import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Injectable()
export class PubSubClients implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PubSubClients.name);

  readonly publisher: Redis;
  readonly subscriber: Redis;

  constructor(redis: RedisService) {
    this.publisher = redis.client.duplicate();
    this.subscriber = redis.client.duplicate();

    for (const [name, client] of [
      ['publisher', this.publisher],
      ['subscriber', this.subscriber],
    ] as const) {
      client.on('error', (e: Error) =>
        this.logger.error(`Redis pub/sub (${name}): ${e.message}`),
      );
    }
  }

  async onModuleInit(): Promise<void> {
    await Promise.all([
      this.ensureConnected(this.publisher),
      this.ensureConnected(this.subscriber),
    ]);
    this.logger.log('Redis pub/sub подключён');
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
  }

  private ensureConnected(client: Redis): Promise<unknown> {
    return client.status === 'wait' ? client.connect() : Promise.resolve();
  }
}
