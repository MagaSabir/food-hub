import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setupGlobalPrefix } from './global-prefix.setup';
import { setupPipes } from './pipes.setup';
import { setupSwagger } from './swagger.setup';

export function applyAppInitialization(app: INestApplication) {
  const config = app.get(ConfigService);

  setupGlobalPrefix(app, config);
  setupPipes(app);
  setupSwagger(app, config);
}
