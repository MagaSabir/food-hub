import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfig, SwaggerConfig } from '../config';

export function setupSwagger(
  app: INestApplication,
  config: ConfigService,
): void {
  const swagger = config.getOrThrow<SwaggerConfig>('swagger');
  if (!swagger.enabled) return;

  const { name } = config.getOrThrow<AppConfig>('app');
  const document = new DocumentBuilder()
    .setTitle('FoodHub API')
    .setDescription(
      `REST API платформы FoodHub (${name}).\n\n` +
        'Ошибки у всех эндпоинтов приходят в ЕДИНОМ формате (ErrorResponseViewDto): ' +
        'в поле `code` — стабильный машиночитаемый код, по нему клиент решает, ' +
        'как реагировать; в `message` — текст для показа человеку.\n\n' +
        'Эндпоинты со значком замка требуют access-токен: нажмите **Authorize** ' +
        'и вставьте его без слова Bearer.',
    )
    .setVersion('0.1')
    .addBearerAuth()
    .addTag('service', 'Служебное: что и где отвечает')
    .addTag('health', 'Проверка живости для мониторинга')
    .addTag('auth', 'Вход клиента (телефон + код) и админок (email + пароль)')
    .addTag('restaurants', 'Каталог брендов и экран бренда — доступны гостю')
    .addTag('menu', 'Меню бренда и блюдо с модификаторами — доступны гостю')
    .addTag('favorites', 'Избранное клиента — только со своим токеном')
    .build();

  const spec = SwaggerModule.createDocument(app, document);
  SwaggerModule.setup(swagger.path, app, spec);
}
