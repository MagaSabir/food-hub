import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setupGlobalPrefix } from './global-prefix.setup';

export function applyAppInitialization(app: INestApplication) {
  const config = app.get(ConfigService);

  setupGlobalPrefix(app, config);
}
