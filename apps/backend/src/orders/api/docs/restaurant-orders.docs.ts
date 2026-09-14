import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../../common/api/error-response.view-dto';
import { OrderViewDto } from '../view-dto/order.view-dto';
import { RestaurantOrderListItemViewDto } from '../view-dto/restaurant-order-list-item.view-dto';

const staffOnly = () => [
  ApiBearerAuth(),
  ApiUnauthorizedResponse({
    description: 'Нет токена или он не принят',
    type: ErrorResponseViewDto,
  }),
  ApiForbiddenResponse({
    description: 'ACCESS_DENIED — это раздел ресторана, клиенту сюда нельзя',
    type: ErrorResponseViewDto,
  }),
];

export const ApiGetRestaurantOrders = () =>
  applyDecorators(
    ...staffOnly(),
    ApiOperation({
      summary: 'Заказы моей точки (свежие сверху)',
      description:
        'Что видно, определяет ТОКЕН: сотрудник — заказы своей точки, ' +
        'владелец бренда (без привязки к точке) — заказы всех своих точек. ' +
        'Параметров «чей ресторан» и «какая точка» не существует.\n\n' +
        'Строка короткая: номер, статус, тип, время, точка, адрес доставки, ' +
        'сумма и число позиций. Состав заказа приходит по ' +
        'GET /admin/restaurant/orders/{id}, когда заказ открывают.\n\n' +
        'Этим же запросом админка обновляет список, получив живое событие ' +
        '`order:new` по WebSocket (Шаг 5.2).\n\n' +
        'Отдаём последние 50; курсор появится вместе с экраном админки (Этап 8).',
    }),
    ApiOkResponse({ type: RestaurantOrderListItemViewDto, isArray: true }),
  );

export const ApiGetRestaurantOrderById = () =>
  applyDecorators(
    ...staffOnly(),
    ApiOperation({
      summary: 'Заказ ресторана по id',
      description:
        'Полная карточка: снимки позиций и модификаторов, суммы, адрес ' +
        'доставки, телефон для связи, комментарий клиента. Форма ТА ЖЕ, что ' +
        'видит клиент, — чек это один документ.\n\n' +
        'ИЗОЛЯЦИЯ: бренд (и точка, если сотрудник к ней привязан) стоят в ' +
        'самом запросе к базе. На чужой заказ отвечаем ORDER_NOT_FOUND — тем ' +
        'же, что и на несуществующий.',
    }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiOkResponse({ type: OrderViewDto }),
    ApiNotFoundResponse({
      description: 'ORDER_NOT_FOUND — заказа нет или он не вашего ресторана',
      type: ErrorResponseViewDto,
    }),
  );
