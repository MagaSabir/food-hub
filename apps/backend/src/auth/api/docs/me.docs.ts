import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../../common/api/error-response.view-dto';
import { MeViewDto } from '../view-dto/me.view-dto';

export const ApiMe = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Текущий пользователь по access-токену',
      description:
        'Данные читаются из БД, а не из токена: токен живёт 15 минут и мог ' +
        'устареть (сменили роль, выключили аккаунт). Доступен любой роли.',
    }),
    ApiOkResponse({ type: MeViewDto }),
    ApiUnauthorizedResponse({
      description:
        'INVALID_ACCESS_TOKEN — токена нет, он не принят, либо аккаунт ' +
        'выключен или удалён.',
      type: ErrorResponseViewDto,
    }),
  );
