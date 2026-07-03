import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../config';

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = config.getOrThrow<DatabaseConfig>('database');
        return new PrismaService(db.url, db.logQueries);
      },
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule {}
