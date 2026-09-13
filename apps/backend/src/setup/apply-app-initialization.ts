import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setupCookie } from './cookie.setup';
import { setupGlobalPrefix } from './global-prefix.setup';
import { setupPipes } from './pipes.setup';
import { setupSwagger } from './swagger.setup';

export function applyAppInitialization(app: INestApplication) {
  const config = app.get(ConfigService);

  setupCookie(app, config);
  setupGlobalPrefix(app, config);
  setupPipes(app);
  setupSwagger(app, config);
}
