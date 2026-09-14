import { registerAs } from '@nestjs/config';
import { PushConfig } from './types';

export const pushConfig = registerAs(
  'push',
  (): PushConfig => ({
    expoAccessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
  }),
);
