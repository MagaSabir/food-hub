import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { AuthTokenService } from '../../application/services/auth-token.service';
import { InvalidAccessTokenError } from '../../domain/errors/auth.errors';
import { AccessTokenGuard, RequestWithUser } from './access-token.guard';

const PAYLOAD = { sub: 'staff-1', role: Role.RESTAURANT_OWNER };

describe('AccessTokenGuard', () => {
  function build(
    headers: Record<string, string>,
    {
      isPublic = false,
      verifyAccess = jest.fn().mockResolvedValue(PAYLOAD),
    } = {},
  ) {
    const request = { headers } as unknown as RequestWithUser;
    const guard = new AccessTokenGuard(
      { verifyAccess } as unknown as AuthTokenService,
      { getAllAndOverride: () => isPublic } as unknown as Reflector,
    );
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;

    return { guard, context, request, verifyAccess };
  }

  it('валидный Bearer → пропускает и кладёт пользователя в запрос', async () => {
    const { guard, context, request, verifyAccess } = build({
      authorization: 'Bearer good.token',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAccess).toHaveBeenCalledWith('good.token');
    expect(request.user).toEqual(PAYLOAD);
  });

  it('@Public → пропускает без токена и НЕ проверяет его', async () => {
    const verifyAccess = jest.fn();
    const { guard, context, request } = build(
      {},
      { isPublic: true, verifyAccess },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAccess).not.toHaveBeenCalled();
    expect(request.user).toBeUndefined();
  });

  describe('отказы', () => {
    it('нет заголовка → 401', async () => {
      const { guard, context } = build({});

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        InvalidAccessTokenError,
      );
    });

    it('чужая схема (Basic) → 401', async () => {
      const { guard, context } = build({ authorization: 'Basic abc123' });

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        InvalidAccessTokenError,
      );
    });

    it('«Bearer» без токена → 401', async () => {
      const { guard, context } = build({ authorization: 'Bearer' });

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        InvalidAccessTokenError,
      );
    });

    it('битая подпись или истёкший срок → та же ошибка, без подробностей', async () => {
      const { guard, context } = build(
        { authorization: 'Bearer expired.token' },
        { verifyAccess: jest.fn().mockRejectedValue(new Error('jwt expired')) },
      );

      const error = await guard.canActivate(context).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(InvalidAccessTokenError);
      expect((error as Error).message).not.toContain('expired');
    });
  });

  it('схема регистронезависима (bearer)', async () => {
    const { guard, context } = build({ authorization: 'bearer good.token' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
