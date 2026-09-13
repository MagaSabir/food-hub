import { appConfig } from './app.config';
import { environmentConfig } from './environment.config';
import { swaggerConfig } from './swagger.config';
import { databaseConfig } from './database.config';
import { authConfig } from './auth.config';
import { redisConfig } from './redis.config';
import { cookieConfig } from './cookie.config';
import { throttleConfig } from './throttle.config';

export const configLoaders = [
  appConfig,
  environmentConfig,
  swaggerConfig,
  databaseConfig,
  authConfig,
  redisConfig,
  cookieConfig,
  throttleConfig,
];

export {
  appConfig,
  environmentConfig,
  swaggerConfig,
  authConfig,
  redisConfig,
  cookieConfig,
  throttleConfig,
};

export * from './types';
