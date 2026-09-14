import { applyDecorators } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../common/api/error-response.view-dto';
import { MenuCategoryViewDto } from '../view-dto/menu-category.view-dto';
import { MenuItemDetailsViewDto } from '../view-dto/menu-item-details.view-dto';

export const ApiGetBrandMenu = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Меню бренда (разделы с позициями)',
      description:
        'Меню принадлежит БРЕНДУ, а не точке: одноточечным партнёрам (это 90%) ' +
        'иначе пришлось бы вести его в каждой точке. Разделы и позиции — в ' +
        'порядке, который задал ресторан. Позиции из стоп-листа приходят с ' +
        'isAvailable=false, а не пропадают. Цены уже с учётом действующих скидок.',
    }),
    ApiParam({ name: 'slug', example: 'syrovarnya' }),
    ApiOkResponse({ type: MenuCategoryViewDto, isArray: true }),
    ApiNotFoundResponse({
      description:
        'RESTAURANT_NOT_FOUND — нет такого бренда, он выключен или скрыт',
      type: ErrorResponseViewDto,
    }),
  );

export const ApiGetMenuItem = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Блюдо с модификаторами (шторка выбора)',
      description:
        'Все фото и группы модификаторов с правилами выбора (SINGLE/MULTIPLE, ' +
        'обязательность, min/max). Правила отдаём, чтобы приложение рисовало ' +
        'форму и считало цену на лету, но при создании заказа их заново ' +
        'проверит backend — клиентским данным не доверяем.',
    }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiOkResponse({ type: MenuItemDetailsViewDto }),
    ApiNotFoundResponse({
      description:
        'MENU_ITEM_NOT_FOUND — блюда нет, его раздел скрыт или бренд выключен',
      type: ErrorResponseViewDto,
    }),
  );
