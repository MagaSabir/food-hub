import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../common/api/error-response.view-dto';

export const ApiRegisterDevice = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Запомнить устройство для push-уведомлений',
      description:
        'Приложение зовёт это после входа и при каждом запуске: адрес от ' +
        'Expo может смениться (переустановка, обновление). Идемпотентно — ' +
        'повторный вызов с тем же токеном не создаёт дубль. Если токен уже ' +
        'числился за другим человеком, он ПЕРЕЕЗЖАЕТ к текущему: телефон ' +
        'один, а вошли в него заново, и уведомления должны идти новому ' +
        'владельцу.',
    }),
    ApiNoContentResponse({ description: 'Устройство запомнено' }),
    ApiBadRequestResponse({
      description: 'VALIDATION_ERROR — токен не похож на push-адрес Expo',
      type: ErrorResponseViewDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Нет токена или он не принят',
      type: ErrorResponseViewDto,
    }),
    ApiForbiddenResponse({
      description:
        'ACCESS_DENIED — push есть только у клиента: приложение с ними одно',
      type: ErrorResponseViewDto,
    }),
  );
