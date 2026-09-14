import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../../common/api/error-response.view-dto';
import { DeliveryQuoteViewDto } from '../view-dto/delivery-quote.view-dto';

export const ApiGetDeliveryQuote = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Расчёт корзины: суммы, точка-исполнитель, доставка',
      description:
        'Предпросмотр заказа: те же правила и те же цифры, что применит ' +
        'оформление, но ничего не создаётся. Экран корзины зовёт его при ' +
        'каждом изменении состава или адреса.\n\n' +
        'Клиент присылает ТОЛЬКО состав (id блюд, количество, id опций) и ' +
        'адрес — цены, скидки и стоимость доставки считает backend.\n\n' +
        'Для DELIVERY точку-исполнителя выбирает сервер (ближайшая, которая ' +
        'достаёт до адреса и работает сейчас); для PICKUP/DINE_IN её называет ' +
        'клиент в branchId.\n\n' +
        'Доступен ГОСТЮ: корзина собирается до входа, номер подтверждается ' +
        'при оформлении (отложенная регистрация).\n\n' +
        'ВАЖНО про ответ: «закрыто», «далеко», «не набрана сумма» — это НЕ ' +
        'ошибки, а поля `canOrder`/`blockReason`. Ошибкой отвечаем только на ' +
        'испорченную корзину (нет блюда, стоп-лист, неверный набор опций).',
    }),
    ApiOkResponse({ type: DeliveryQuoteViewDto }),
    ApiBadRequestResponse({
      description:
        'VALIDATION_ERROR — тело не прошло проверку; ' +
        'MENU_ITEM_UNAVAILABLE — блюдо в стоп-листе; ' +
        'INVALID_MODIFIERS — набор опций не соответствует правилам блюда.',
      type: ErrorResponseViewDto,
    }),
    ApiNotFoundResponse({
      description:
        'RESTAURANT_NOT_FOUND — бренда нет, он выключен платформой или скрыт ' +
        'партнёром; MENU_ITEM_NOT_FOUND — позиции нет в меню этого бренда.',
      type: ErrorResponseViewDto,
    }),
  );
