import { registerAs } from '@nestjs/config';
import { EnvironmentConfig, NodeEnv } from './types';

export const environmentConfig = registerAs(
  'environment',
  (): EnvironmentConfig => {
    const nodeEnv = (process.env.NODE_ENV ?? 'development') as NodeEnv;
    return {
      nodeEnv,
      isDevelopment: nodeEnv === 'development',
      isTest: nodeEnv === 'test',
      isProduction: nodeEnv === 'production',
    };
  },
);
