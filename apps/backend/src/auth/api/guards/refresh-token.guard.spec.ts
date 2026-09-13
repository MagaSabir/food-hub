import { ExecutionContext } from '@nestjs/common';
import { AuthTokenService } from '../../application/services/auth-token.service';
import { AuthSubjectType } from '../../domain/types/auth-subject';
import { InvalidRefreshTokenError } from '../../domain/errors/auth.errors';
import {
  RefreshTokenGuard,
  RequestWithRefreshSession,
} from './refresh-token.guard';

const PAYLOAD = {
  sub: 'staff-1',
  subjectType: AuthSubjectType.STAFF,
  sessionId: 'session-1',
  iat: 1,
  exp: 2,
};

describe('RefreshTokenGuard', () => {
  function build(
    request: Partial<RequestWithRefreshSession>,
    verifyRefresh = jest.fn().mockResolvedValue(PAYLOAD),
  ) {
    const guard = new RefreshTokenGuard({
      verifyRefresh,
    } as unknown as AuthTokenService);

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    return { guard, context, request, verifyRefresh };
  }

  it('берёт токен из cookie (веб-админки)', async () => {
    const { guard, context, request, verifyRefresh } = build({
      cookies: { refreshToken: 'from.cookie' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyRefresh).toHaveBeenCalledWith('from.cookie');
    expect(request.refreshSession).toEqual({
      subjectId: PAYLOAD.sub,
      subjectType: AuthSubjectType.STAFF,
      sessionId: PAYLOAD.sessionId,
      token: 'from.cookie',
      source: 'cookie',
    });
  });

  it('берёт токен из тела, если cookie нет (мобильное приложение)', async () => {
    const { guard, context, request, verifyRefresh } = build({
      body: { refreshToken: 'from.body' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyRefresh).toHaveBeenCalledWith('from.body');
    expect(request.refreshSession?.source).toBe('body');
  });

  it('cookie важнее тела', async () => {
    const { guard, context, verifyRefresh } = build({
      cookies: { refreshToken: 'from.cookie' },
      body: { refreshToken: 'from.body' },
    });

    await guard.canActivate(context);
    expect(verifyRefresh).toHaveBeenCalledWith('from.cookie');
  });

  it('токена нет вовсе → отказ', async () => {
    const { guard, context } = build({ cookies: {}, body: {} });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
  });

  it('битая подпись или истёкший срок → та же ошибка, без подробностей', async () => {
    const { guard, context } = build(
      { cookies: { refreshToken: 'broken' } },
      jest.fn().mockRejectedValue(new Error('jwt expired')),
    );

    const error = await guard.canActivate(context).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(InvalidRefreshTokenError);
    expect((error as Error).message).not.toContain('expired');
  });
});
