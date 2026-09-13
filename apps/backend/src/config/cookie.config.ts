import { registerAs } from '@nestjs/config';
import { CookieConfig } from './types';

export const cookieConfig = registerAs(
  'cookie',
  (): CookieConfig => ({
    secret: process.env.COOKIE_SECRET || undefined,
    httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: (process.env.COOKIE_SAME_SITE ?? 'lax') as
      | 'lax'
      | 'strict'
      | 'none',
    maxAge: parseInt(process.env.COOKIE_MAX_AGE ?? '2592000000', 10),
  }),
);
