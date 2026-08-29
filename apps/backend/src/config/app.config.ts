import { registerAs } from '@nestjs/config';
import { AppConfig } from './types';

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    name: process.env.APP_NAME ?? 'foodhub',
    port: parseInt(process.env.PORT ?? '3000', 10),
    globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',
    sendInternalServerErrorDetails:
      process.env.SEND_INTERNAL_ERROR_DETAILS === 'true',
  }),
);
