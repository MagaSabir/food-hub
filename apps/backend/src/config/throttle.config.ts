import { registerAs } from '@nestjs/config';
import { ThrottleConfig } from './types';

export const throttleConfig = registerAs(
  'throttle',
  (): ThrottleConfig => ({
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  }),
);
