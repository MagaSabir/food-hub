import { applyDecorators } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../../common/api/error-response.view-dto';
import { RestaurantDetailsViewDto } from '../view-dto/restaurant-details.view-dto';

export const ApiGetRestaurantBySlug = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Бренд по slug (экран ресторана)',
      description:
        'Карточка бренда + его активные точки (адрес, график, минимальная сумма). ' +
        'Ищем по slug, а не по id: slug стоит в ссылке приложения и в диплинке. ' +
        'Меню отдаётся отдельно — Шаг 3.2.',
    }),
    ApiParam({ name: 'slug', example: 'syrovarnya' }),
    ApiOkResponse({ type: RestaurantDetailsViewDto }),
    ApiNotFoundResponse({
      description:
        'RESTAURANT_NOT_FOUND. Один ответ на все причины: нет такого slug, ' +
        'бренд выключен платформой или скрыт партнёром.',
      type: ErrorResponseViewDto,
    }),
  );
