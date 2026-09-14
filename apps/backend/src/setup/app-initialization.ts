import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setupCors } from './cors.setup';
import { setupCookie } from './cookie.setup';
import { setupPipes } from './pipes.setup';
import { setupGlobalPrefix } from './global-prefix.setup';
import { setupSwagger } from './swagger.setup';
import { setupWebsockets } from './websockets.setup';

export function applyAppInitialization(app: INestApplication): void {
  const config = app.get(ConfigService);

  setupCors(app, config);
  setupCookie(app, config);
  setupPipes(app);
  setupGlobalPrefix(app, config);
  setupSwagger(app, config);
  setupWebsockets(app, config);
}
