import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../../common/api/error-response.view-dto';
import { OrderViewDto } from '../view-dto/order.view-dto';

const orderAction = () => [
  ApiBearerAuth(),
  ApiParam({ name: 'id', format: 'uuid' }),
  ApiOkResponse({
    type: OrderViewDto,
    description: 'Карточка заказа после изменения — в ней уже новый статус',
  }),
  ApiUnauthorizedResponse({
    description: 'Нет токена или он не принят',
    type: ErrorResponseViewDto,
  }),
  ApiForbiddenResponse({
    description: 'ACCESS_DENIED — заказами распоряжается ресторан, не клиент',
    type: ErrorResponseViewDto,
  }),
  ApiNotFoundResponse({
    description: 'ORDER_NOT_FOUND — заказа нет или он не вашего ресторана',
    type: ErrorResponseViewDto,
  }),
  ApiBadRequestResponse({
    description: 'VALIDATION_ERROR — неверное тело запроса',
    type: ErrorResponseViewDto,
  }),
  ApiConflictResponse({
    description:
      'ORDER_STATUS_CONFLICT — с заказом случилось ДРУГОЕ: его отменили, ' +
      'пока вы принимали, или он доигран. Реакция: перечитать заказ.\n\n' +
      'Повтор того же действия конфликтом НЕ считается — см. описание ниже.',
    type: ErrorResponseViewDto,
  }),
];

export const ApiAcceptOrder = () =>
  applyDecorators(
    ...orderAction(),
    ApiOperation({
      summary: 'Принять заказ (+ время готовки)',
      description:
        'PENDING → ACCEPTED. Время готовки обязательно: человек на другом ' +
        'конце ждёт ответа на вопрос «когда», и «принято» без срока — это ' +
        'молчание.\n\n' +
        'Момент приёма пишется в `accepted_at` и в аудит `order_status_log` ' +
        'ОДНОЙ транзакцией со сменой статуса.\n\n' +
        'СРАЗУ ПОСЛЕ ПРИЁМА заказ автоматически уходит в PREPARING (спека 06) ' +
        '— поэтому в ответе вы увидите именно его. Отдельной кнопки «начать ' +
        'готовить» у кухни нет: между «принял» и «готовлю» нет решения, ' +
        'которое принимает человек.\n\n' +
        'ИДЕМПОТЕНТНО: повторное «Принять» (двойной клик, повтор после обрыва ' +
        'связи) вернёт 200 и текущую карточку, второй записи в аудит не будет. ' +
        'Двое, нажавшие одновременно, тоже оба получат 200 — принято будет ' +
        'ровно один раз (условный UPDATE в базе).',
    }),
  );

export const ApiRejectOrder = () =>
  applyDecorators(
    ...orderAction(),
    ApiOperation({
      summary: 'Отклонить заказ (+ причина)',
      description:
        'Любой статус, кроме доигранного → CANCELLED. Причину ЧИТАЕТ клиент, ' +
        'поэтому она обязательна и не может быть прочерком.\n\n' +
        'Доставленный заказ отклонить нельзя — ORDER_STATUS_CONFLICT.\n\n' +
        'ИДЕМПОТЕНТНО: повторный отказ вернёт 200 и заказ с ПЕРВОЙ причиной — ' +
        'она уже показана клиенту, и переписывать её задним числом нельзя.',
    }),
  );

export const ApiChangeOrderStatus = () =>
  applyDecorators(
    ...orderAction(),
    ApiOperation({
      summary: 'Следующий статус заказа',
      description:
        'Двигает заказ на ОДИН шаг вперёд по его маршруту:\n\n' +
        '• доставка: PREPARING → ON_THE_WAY → COMPLETED\n' +
        '• самовывоз и зал: PREPARING → READY → COMPLETED\n\n' +
        'Перескок через шаг и возврат назад запрещены (ORDER_STATUS_CONFLICT): ' +
        'каждый шаг что-то значит, и пропущенный превращает историю заказа ' +
        'в догадки.\n\n' +
        'Приём и отказ сюда не входят — у них свои действия, потому что они ' +
        'несут с собой обязательные данные.\n\n' +
        'ИДЕМПОТЕНТНО: если заказ уже в этом статусе или ушёл дальше по ' +
        'маршруту, вернётся 200 с текущей карточкой, а не ошибка.',
    }),
  );
