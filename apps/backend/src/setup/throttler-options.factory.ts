import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ThrottleConfig } from '../config';
import { RedisService } from '../redis/redis.service';

type ThrottlerOptionsWithStorage = Extract<
  ThrottlerModuleOptions,
  { throttlers: unknown }
>;

export function buildThrottlerOptions(
  throttle: ThrottleConfig,
  redis: RedisService,
): ThrottlerOptionsWithStorage {
  return {
    throttlers: [{ ttl: throttle.ttl * 1000, limit: throttle.limit }],
    storage: new ThrottlerStorageRedisService(redis.client),
  };
}
