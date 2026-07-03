import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerConfig } from '../config';

export function setupSwagger(app: INestApplication, config: ConfigService) {
  const swagger = config.getOrThrow<SwaggerConfig>('swagger');
  if (!swagger.enabled) return;

  const document = new DocumentBuilder()
    .setTitle('FoodHubMe API')
    .setDescription('REST API platform FoodHubMe')
    .setVersion('0.1')
    .addBearerAuth()
    .build();

  const spec = SwaggerModule.createDocument(app, document);
  SwaggerModule.setup(swagger.path, app, spec);
}
