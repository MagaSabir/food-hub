import { appConfig } from './app.config';
import { environmentConfig } from './environment.config';
import { swaggerConfig } from './swagger.config';

export const configLoaders = [appConfig, environmentConfig, swaggerConfig];
export { appConfig, environmentConfig, swaggerConfig };
export * from './types';
