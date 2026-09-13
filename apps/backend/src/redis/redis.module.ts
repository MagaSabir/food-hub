import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import { RedisConfig } from '../config';

@Global()
@Module({
  providers: [
    {
      provide: RedisService,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = config.getOrThrow<RedisConfig>('redis');
        return new RedisService(redis.url);
      },
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
