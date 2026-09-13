import { registerAs } from '@nestjs/config';
import { AuthConfig } from './types';

export const authConfig = registerAs(
  'auth',
  (): AuthConfig => ({
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  }),
);
