import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../../common/api/error-response.view-dto';
import { ClientAuthTokensViewDto } from '../view-dto/client-auth-tokens.view-dto';

export const ApiVerifyOtp = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Подтвердить номер кодом и войти',
      description:
        'Точка отложенной регистрации: номера нет в базе — клиент создаётся, ' +
        'есть — находится. Для человека это одно действие. ' +
        'Код одноразовый и гасится сразу. Попыток ввода — 5, потом код мёртв. ' +
        'Refresh возвращается В ТЕЛЕ (мобильному приложению cookie не подходит) ' +
        'и хранится в expo-secure-store.',
    }),
    ApiOkResponse({ type: ClientAuthTokensViewDto }),
    ApiBadRequestResponse({
      description: 'Некорректный номер или формат кода',
      type: ErrorResponseViewDto,
    }),
    ApiUnauthorizedResponse({
      description:
        'INVALID_OTP — код неверный, истёк или не запрашивался (один ответ ' +
        'на все случаи); OTP_ATTEMPTS_EXCEEDED — попытки исчерпаны.',
      type: ErrorResponseViewDto,
    }),
  );
