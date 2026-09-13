import { applyDecorators } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../../common/api/error-response.view-dto';
import { ClientAuthTokensViewDto } from '../view-dto/client-auth-tokens.view-dto';

export const ApiRefreshTokens = () =>
  applyDecorators(
    ApiCookieAuth('refreshToken'),
    ApiOperation({
      summary: 'Обменять refresh-токен на новую пару',
      description:
        'Refresh берётся из httpOnly-cookie (веб-админки) или из поля ' +
        'refreshToken в теле (мобильное приложение). Каждое обновление ' +
        'выдаёт НОВЫЙ refresh — старый сразу перестаёт работать. ' +
        'Повторное использование старого токена считается утечкой: ' +
        'гасятся все сессии этого аккаунта. ' +
        'ОТВЕТ ЗАВИСИТ ОТ КАНАЛА: пришёл токен в cookie — новый уедет тоже ' +
        'в cookie, а в теле будет только accessToken; пришёл в теле — в теле ' +
        'вернутся оба токена (схема ниже).',
    }),
    ApiOkResponse({ type: ClientAuthTokensViewDto }),
    ApiUnauthorizedResponse({
      description:
        'INVALID_REFRESH_TOKEN — токен испорчен, протух, отозван или уже был ' +
        'использован. Клиенту нужно войти заново.',
      type: ErrorResponseViewDto,
    }),
  );

export const ApiLogout = () =>
  applyDecorators(
    ApiCookieAuth('refreshToken'),
    ApiOperation({
      summary: 'Выход — закрыть текущую сессию',
      description:
        'Refresh отзывается сразу, cookie очищается. Ранее выданный ' +
        'access-токен доживает свой короткий срок (до 15 минут) — отозвать его нельзя.',
    }),
    ApiNoContentResponse({ description: 'Сессия закрыта' }),
    ApiUnauthorizedResponse({
      description: 'INVALID_REFRESH_TOKEN',
      type: ErrorResponseViewDto,
    }),
  );
