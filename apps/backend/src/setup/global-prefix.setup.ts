import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config';

export function globalPrefixSetup(
  app: INestApplication,
  config: ConfigService,
) {
  const { globalPrefix } = config.getOrThrow<AppConfig>('app');
  app.setGlobalPrefix(globalPrefix);
}
