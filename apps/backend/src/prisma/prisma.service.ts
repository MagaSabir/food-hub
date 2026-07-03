import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor(databaseUrl: string, logQueries: boolean) {
    const pool = new Pool({ connectionString: databaseUrl });
    super({
      adapter: new PrismaPg(pool),
      log: logQueries ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully✅');
    } catch (e) {
      this.logger.error(
        `❌Не удалось подключиться к БД: ${(e as Error).message}`,
      );
      throw e;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}
