import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../../common/api/error-response.view-dto';
import { AuthTokensViewDto } from '../view-dto/auth-tokens.view-dto';

export const ApiLogin = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Вход в админку по email и паролю',
      description:
        'Для сотрудников ресторана (scope=restaurant) и админов платформы ' +
        '(scope=platform). Клиенты входят иначе — по телефону и SMS-коду. ' +
        'Возвращает access-токен; refresh появится на Шаге 2.2.',
    }),
    ApiOkResponse({ type: AuthTokensViewDto }),
    ApiBadRequestResponse({
      description: 'Не прошла валидация тела запроса',
      type: ErrorResponseViewDto,
    }),
    ApiUnauthorizedResponse({
      description:
        'INVALID_CREDENTIALS. Один ответ на все причины (нет email, неверный ' +
        'пароль, аккаунт выключен) — чтобы нельзя было перебором узнать, ' +
        'какие email существуют.',
      type: ErrorResponseViewDto,
    }),
    ApiTooManyRequestsResponse({
      description: 'Превышен лимит попыток входа (10 в минуту с одного IP)',
      type: ErrorResponseViewDto,
    }),
  );
