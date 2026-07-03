import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from './types';

export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfig => ({
    url: process.env.DATABASE_URL ?? '',
    logQueries: process.env.LOG_QUERIES === 'true',
  }),
);
