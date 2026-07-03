import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config';

export function setupGlobalPrefix(
  app: INestApplication,
  config: ConfigService,
): void {
  const { globalPrefix } = config.getOrThrow<AppConfig>('app');
  app.setGlobalPrefix(globalPrefix);
}
