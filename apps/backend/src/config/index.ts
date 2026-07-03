import { appConfig } from './app.config';
import { environmentConfig } from './environment.config';
import { swaggerConfig } from './swagger.config';
import { databaseConfig } from './database.config';

export const configLoaders = [
  appConfig,
  environmentConfig,
  swaggerConfig,
  databaseConfig,
];

export { appConfig, environmentConfig, swaggerConfig };

export * from './types';
