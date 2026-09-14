import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
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

export const ApiUpdateProfile = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Изменить свой профиль (имя)',
      description:
        'Только для клиента: у сотрудников и админов имя не здесь. Чей ' +
        'профиль меняем — сервер берёт из токена, в теле этого нет. ' +
        'Отвечает профилем целиком, чтобы приложению не пришлось идти за ' +
        'ним следом отдельным запросом.',
    }),
    ApiOkResponse({ type: MeViewDto }),
    ApiBadRequestResponse({
      description: 'VALIDATION_ERROR — имя короче 2 или длиннее 50 символов',
      type: ErrorResponseViewDto,
    }),
    ApiUnauthorizedResponse({
      description:
        'INVALID_ACCESS_TOKEN — токена нет, он не принят, либо аккаунт удалён',
      type: ErrorResponseViewDto,
    }),
    ApiForbiddenResponse({
      description: 'ACCESS_DENIED — профиль есть только у клиента',
      type: ErrorResponseViewDto,
    }),
  );
