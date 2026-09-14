import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../../common/api/error-response.view-dto';
import { RestaurantListItemViewDto } from '../view-dto/restaurant-list-item.view-dto';

export const ApiGetRestaurants = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Каталог ресторанов (бренды)',
      description:
        'Публичный список брендов: активен, не скрыт партнёром и имеет хотя бы ' +
        'одну активную точку. Фильтры sort/cuisine/city/open — опциональны. ' +
        'Кеш — Шаг 3.3; пагинации нет, появится, когда брендов станет много.',
    }),
    ApiOkResponse({ type: RestaurantListItemViewDto, isArray: true }),
    ApiBadRequestResponse({
      description: 'Неизвестное значение sort или open',
      type: ErrorResponseViewDto,
    }),
  );
