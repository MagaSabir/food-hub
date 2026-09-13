import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../../common/api/error-response.view-dto';
import { OtpRequestedViewDto } from '../view-dto/otp-requested.view-dto';

export const ApiRequestOtp = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Выслать код подтверждения на телефон',
      description:
        'Первый шаг входа клиента (отложенная регистрация). Существует номер ' +
        'в базе или нет — ответ ОДИНАКОВЫЙ: иначе перебором можно узнать, ' +
        'кто пользуется сервисом. Аккаунт создаётся на подтверждении кода. ' +
        'В dev код не отправляется, а пишется в лог сервера.',
    }),
    ApiOkResponse({ type: OtpRequestedViewDto }),
    ApiBadRequestResponse({
      description: 'Некорректный номер телефона',
      type: ErrorResponseViewDto,
    }),
    ApiTooManyRequestsResponse({
      description:
        'OTP_TOO_SOON — не истёк кулдаун (60 сек), либо ' +
        'OTP_LIMIT_EXCEEDED — исчерпан лимит кодов на номер за час.',
      type: ErrorResponseViewDto,
    }),
  );
