import { appConfig } from './app.config';
import { environmentConfig } from './environment.config';

export const configLoaders = [appConfig, environmentConfig];

export { appConfig, environmentConfig };

export * from './types';
