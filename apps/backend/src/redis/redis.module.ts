import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisConfig } from '../config';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { PubSubClients } from './pubsub.clients';

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
    CacheService,
    PubSubClients,
  ],
  exports: [RedisService, CacheService, PubSubClients],
})
export class RedisModule {}
