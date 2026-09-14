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
import { RepeatOrderViewDto } from '../view-dto/repeat-order.view-dto';

export const ApiRepeatOrder = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiOperation({
      summary: 'Что из прошлого заказа можно повторить',
      description:
        'Состав берётся из чека, а цены и наличие — СЕГОДНЯШНИЕ: снимок в ' +
        'заказе это память о том, что было оплачено, а не прайс на сегодня. ' +
        'Позиции, которые повторить нельзя, приходят отдельным списком с ' +
        'причиной: REMOVED (нет в меню), UNAVAILABLE (стоп-лист), CHANGED ' +
        '(изменился набор модификаторов — собрать за человека нельзя). ' +
        'Модификаторы сопоставляются ПО ИМЕНАМ: id опций в чеке не хранятся.',
    }),
    ApiOkResponse({ type: RepeatOrderViewDto }),
    ApiUnauthorizedResponse({
      description: 'Нет токена или он не принят',
      type: ErrorResponseViewDto,
    }),
    ApiForbiddenResponse({
      description: 'ACCESS_DENIED — заказы клиента доступны только клиенту',
      type: ErrorResponseViewDto,
    }),
    ApiNotFoundResponse({
      description:
        'ORDER_NOT_FOUND — заказа нет, он чужой, либо бренд больше не ' +
        'показывается клиенту (повторять некуда).',
      type: ErrorResponseViewDto,
    }),
  );
