import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../../common/api/error-response.view-dto';
import { OrderViewDto } from '../view-dto/order.view-dto';

export const ApiCreateOrder = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Оформить заказ (доставка, самовывоз или в зале)',
      description:
        'Создаёт заказ в статусе PENDING — ресторан ответит на него в ' +
        'админке (Этап 5).\n\n' +
        'Суммы считает backend теми же правилами, что и POST /orders/quote: ' +
        'цифры на экране корзины и цифры в чеке приходят из одного кода. ' +
        'Присланные клиентом цены игнорируются — их в теле запроса просто нет.\n\n' +
        'Заказ, его строки, снимки модификаторов и первая запись лога статусов ' +
        'пишутся ОДНОЙ транзакцией: «половины заказа» не бывает.\n\n' +
        'Точка-исполнитель: для DELIVERY её выбирает сервер (ближайшая из тех, ' +
        'кто достаёт до адреса и работает сейчас); для PICKUP/DINE_IN её ' +
        'называет клиент в branchId.\n\n' +
        'Владелец заказа берётся ИЗ ТОКЕНА. Телефон — из тела или ' +
        'подтверждённый номер профиля; в заказ он ложится снимком.\n\n' +
        'ОТЛИЧИЕ ОТ РАСЧЁТА КОРЗИНЫ: «закрыто / далеко / не набрана сумма» ' +
        'здесь не поля ответа, а отказ ORDER_NOT_AVAILABLE — создавать заказ, ' +
        'который некому исполнить, нельзя.',
    }),
    ApiCreatedResponse({ type: OrderViewDto }),
    ApiBadRequestResponse({
      description:
        'VALIDATION_ERROR — тело не прошло проверку; ' +
        'ORDER_NOT_AVAILABLE — закрыто, не принимают, адрес вне зоны, ' +
        'не набрана минимальная сумма или нет подходящей точки; ' +
        'MENU_ITEM_UNAVAILABLE — блюдо в стоп-листе; ' +
        'INVALID_MODIFIERS — набор опций не соответствует правилам блюда; ' +
        'PAYMENT_METHOD_UNAVAILABLE — онлайн-оплата появится на Этапе 11.',
      type: ErrorResponseViewDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Нет токена или он не принят',
      type: ErrorResponseViewDto,
    }),
    ApiForbiddenResponse({
      description: 'ACCESS_DENIED — заказы оформляет клиент, не сотрудник',
      type: ErrorResponseViewDto,
    }),
    ApiNotFoundResponse({
      description:
        'RESTAURANT_NOT_FOUND — бренда нет, он выключен платформой или скрыт ' +
        'партнёром; MENU_ITEM_NOT_FOUND — позиции нет в меню этого бренда.',
      type: ErrorResponseViewDto,
    }),
  );
