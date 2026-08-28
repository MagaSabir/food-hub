import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerConfig } from '../config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function swaggerSetup(
  app: INestApplication,
  config: ConfigService,
): void {
  const swagger = config.getOrThrow<SwaggerConfig>('swagger');
  if (!swagger.enabled) return;
  const document = new DocumentBuilder()
    .setTitle('Food-Hub')
    .setVersion('1.0')
    .build();

  const spec = SwaggerModule.createDocument(app, document);
  SwaggerModule.setup(swagger.path, app, spec);
}
