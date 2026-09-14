import { registerAs } from '@nestjs/config';
import { CorsConfig } from './types';

function parseOrigin(raw: string | undefined): boolean | string[] {
  const value = (raw ?? '').trim();
  if (value === '' || value === '*') return true;
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const corsConfig = registerAs(
  'cors',
  (): CorsConfig => ({
    origin: parseOrigin(process.env.CORS_ORIGIN),
    credentials: process.env.CORS_CREDENTIALS !== 'false',
  }),
);
