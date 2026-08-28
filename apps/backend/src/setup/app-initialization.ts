import { globalPrefixSetup } from './global-prefix.setup';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { swaggerSetup } from './swagger.setup';
import { pipesSetup } from './pipes.setup';

export function appInitialization(
  app: INestApplication,
  config: ConfigService,
) {
  globalPrefixSetup(app, config);
  swaggerSetup(app, config);
  pipesSetup(app);
}
