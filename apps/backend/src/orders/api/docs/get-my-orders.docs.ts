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
import { OrderListItemViewDto } from '../view-dto/order-list-item.view-dto';
import { OrderViewDto } from '../view-dto/order.view-dto';

const clientOnly = () => [
  ApiBearerAuth(),
  ApiUnauthorizedResponse({
    description: 'Нет токена или он не принят',
    type: ErrorResponseViewDto,
  }),
  ApiForbiddenResponse({
    description: 'ACCESS_DENIED — заказы есть у клиента, не у сотрудников',
    type: ErrorResponseViewDto,
  }),
];

export const ApiGetMyOrders = () =>
  applyDecorators(
    ...clientOnly(),
    ApiOperation({
      summary: 'Мои заказы (свежие сверху)',
      description:
        'Список заказов вошедшего клиента. Владелец берётся ИЗ ТОКЕНА — ' +
        'параметра «чей список» не существует, чужую историю запросить нечем.\n\n' +
        'Форма строки КОРОЧЕ карточки заказа: номер, заведение, статус, дата, ' +
        'сумма и число позиций. Состав приходит по GET /orders/{id}, когда ' +
        'человек откроет заказ.\n\n' +
        'Отдаём последние 50 заказов; курсор появится вместе с экраном ' +
        'истории (Этап 7).',
    }),
    ApiOkResponse({ type: OrderListItemViewDto, isArray: true }),
  );

export const ApiGetOrderById = () =>
  applyDecorators(
    ...clientOnly(),
    ApiOperation({
      summary: 'Мой заказ по id',
      description:
        'Полная карточка: снимки позиций и модификаторов, суммы, адрес, ' +
        'телефон. Та же форма, что вернуло оформление заказа.\n\n' +
        'ИЗОЛЯЦИЯ: `user_id` стоит в самом запросе к базе. На чужой заказ ' +
        'отвечаем ORDER_NOT_FOUND — тем же, что и на несуществующий: разные ' +
        'ответы позволили бы перебором узнать, какие заказы есть в системе.',
    }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiOkResponse({ type: OrderViewDto }),
    ApiNotFoundResponse({
      description: 'ORDER_NOT_FOUND — заказа нет или он не ваш',
      type: ErrorResponseViewDto,
    }),
  );
