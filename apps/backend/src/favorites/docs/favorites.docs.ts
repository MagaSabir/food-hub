import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../common/api/error-response.view-dto';
import { RestaurantListItemViewDto } from '../../restaurants/api/view-dto/restaurant-list-item.view-dto';

const clientOnly = () => [
  ApiBearerAuth(),
  ApiUnauthorizedResponse({
    description: 'Нет токена или он не принят',
    type: ErrorResponseViewDto,
  }),
  ApiForbiddenResponse({
    description:
      'ACCESS_DENIED — избранное есть только у клиента, не у сотрудников',
    type: ErrorResponseViewDto,
  }),
];

export const ApiGetFavorites = () =>
  applyDecorators(
    ...clientOnly(),
    ApiOperation({
      summary: 'Мои избранные рестораны',
      description:
        'Те же карточки, что в каталоге (одна форма ответа). Свежие сверху. ' +
        'Выключенные и скрытые бренды не показываем, но из избранного не ' +
        'вычёркиваем — партнёр может вернуться.',
    }),
    ApiOkResponse({ type: RestaurantListItemViewDto, isArray: true }),
  );

export const ApiAddFavorite = () =>
  applyDecorators(
    ...clientOnly(),
    ApiOperation({
      summary: 'Добавить ресторан в избранное',
      description:
        'Идемпотентно: повторное добавление не ошибка и не создаёт дубль ' +
        '(двойной тап по сердечку — обычное дело).',
    }),
    ApiNoContentResponse({ description: 'Добавлено (или уже было)' }),
    ApiNotFoundResponse({
      description:
        'RESTAURANT_NOT_FOUND — такого бренда нет, он выключен или скрыт',
      type: ErrorResponseViewDto,
    }),
  );

export const ApiRemoveFavorite = () =>
  applyDecorators(
    ...clientOnly(),
    ApiOperation({
      summary: 'Убрать ресторан из избранного',
      description:
        'Идемпотентно: если его там не было — тоже успех. Клиент хотел, чтобы ' +
        'бренда в избранном не было, и его там нет.',
    }),
    ApiParam({ name: 'restaurantId', format: 'uuid' }),
    ApiNoContentResponse({ description: 'Убрано (или не было)' }),
  );
