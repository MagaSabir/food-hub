import { appConfig } from './app.config';
import { environmentConfig } from './environment.config';
import { swaggerConfig } from './swagger.config';
import { databaseConfig } from './database.config';
import { authConfig } from './auth.config';
import { redisConfig } from './redis.config';

export const configLoaders = [
  appConfig,
  environmentConfig,
  swaggerConfig,
  databaseConfig,
  authConfig,
  redisConfig,
];

export { appConfig, environmentConfig, swaggerConfig, authConfig, redisConfig };

export * from './types';
