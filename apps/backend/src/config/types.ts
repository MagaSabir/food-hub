export interface AppConfig {
  name: string;
  port: number;
  globalPrefix: string;
  sendInternalServerErrorDetails: boolean;
}

export type NodeEnv = 'development' | 'production' | 'test';

export interface EnvironmentConfig {
  nodeEnv: NodeEnv;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

export interface SwaggerConfig {
  enabled: boolean;
  path: string;
}
