import { AsyncLocalStorage } from 'node:async_hooks';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  private readonly als = new AsyncLocalStorage<{
    tx: Prisma.TransactionClient;
  }>();

  private readonly self: Prisma.TransactionClient;

  constructor(databaseUrl: string, logQueries: boolean) {
    const pool = new Pool({ connectionString: databaseUrl });
    super({
      adapter: new PrismaPg(pool),
      log: logQueries ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
    this.pool = pool;
    this.self = this;
  }

  get client(): Prisma.TransactionClient {
    return this.als.getStore()?.tx ?? this.self;
  }

  runInTransaction<T>(
    fn: () => Promise<T>,
    options?: { maxWait?: number; timeout?: number },
  ): Promise<T> {
    if (this.als.getStore()) return fn();

    return this.$transaction((tx) => this.als.run({ tx }, fn), options);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('PostgreSQL подключён (Prisma)');
    } catch (e) {
      this.logger.error(
        `Не удалось подключиться к БД: ${(e as Error).message}`,
      );
      throw e;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}
