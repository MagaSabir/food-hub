import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CorsConfig } from '../config';

export function setupCors(app: INestApplication, config: ConfigService): void {
  const cors = config.getOrThrow<CorsConfig>('cors');
  app.enableCors({
    origin: cors.origin,
    credentials: cors.credentials,
  });
}
