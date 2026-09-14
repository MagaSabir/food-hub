import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisConfig } from '../config';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<RedisConfig>('redis').url,
          maxRetriesPerRequest: null,
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: { age: 24 * 3600, count: 1000 },
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
