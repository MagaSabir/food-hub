import cookieParser from 'cookie-parser';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieConfig } from '../config';

export function setupCookie(
  app: INestApplication,
  config: ConfigService,
): void {
  const cookie = config.getOrThrow<CookieConfig>('cookie');
  app.use(cookieParser(cookie.secret || undefined));
}
