import { appConfig } from './app.config';
import { environmentConfig } from './environment.config';
import { corsConfig } from './cors.config';
import { cookieConfig } from './cookie.config';
import { swaggerConfig } from './swagger.config';
import { throttleConfig } from './throttle.config';
import { databaseConfig } from './database.config';
import { redisConfig } from './redis.config';
import { authConfig } from './auth.config';

export const configLoaders = [
  appConfig,
  environmentConfig,
  corsConfig,
  cookieConfig,
  swaggerConfig,
  throttleConfig,
  databaseConfig,
  redisConfig,
  authConfig,
];

export {
  appConfig,
  environmentConfig,
  corsConfig,
  cookieConfig,
  swaggerConfig,
  throttleConfig,
  databaseConfig,
  redisConfig,
  authConfig,
};
export { envValidationSchema, envValidationOptions } from './env.validation';
export * from './types';
