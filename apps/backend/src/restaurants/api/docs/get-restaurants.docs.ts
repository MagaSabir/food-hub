import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { RestaurantListItemViewDto } from '../view-dto/restaurant-list-item.view-dto';

export const ApiGetRestaurants = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Каталог ресторанов (бренды)',
      description: 'Публичный список брендов',
    }),
    ApiOkResponse({ type: RestaurantListItemViewDto, isArray: true }),
  );
