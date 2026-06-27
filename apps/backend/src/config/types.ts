export type NodeEnv = 'development' | 'test' | 'production';

export interface AppConfig {
  name: string;
  port: number;
  globalPrefix: string;
  sendInternalServerErrorDetails: boolean;
}

export interface EnvironmentConfig {
  nodeEnv: NodeEnv;
  isDevelopment: boolean;
  isTest: boolean;
  isProduction: boolean;
}

export interface SwaggerConfig {
  enabled: boolean;
  path: string;
}
