import { registerAs } from '@nestjs/config';
import { RedisConfig } from './types';

export const redisConfig = registerAs(
  'redis',
  (): RedisConfig => ({
    url: process.env.REDIS_URL ?? '',
  }),
);
