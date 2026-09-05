import { appConfig } from './app.config';
import { environmentConfig } from './environment.config';
import { swaggerConfig } from './swagger.config';
import { databaseConfig } from './database.config';
import { authConfig } from './auth.config';

export const configLoaders = [
  appConfig,
  environmentConfig,
  swaggerConfig,
  databaseConfig,
  authConfig,
];

export { appConfig, environmentConfig, swaggerConfig, authConfig };

export * from './types';
