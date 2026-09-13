import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import {
  AccessDeniedError,
  InvalidAccessTokenError,
} from '../../domain/errors/auth.errors';
import { RequestWithUser } from './access-token.guard';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  function build(required: Role[] | undefined, role?: Role) {
    const request = {
      user: role ? { sub: 'id-1', role } : undefined,
    } as RequestWithUser;

    const guard = new RolesGuard({
      getAllAndOverride: () => required,
    } as unknown as Reflector);

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;

    return { guard, context };
  }

  it('без @Roles пускает любого вошедшего', () => {
    const { guard, context } = build(undefined, Role.RESTAURANT_STAFF);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('пустой список ролей = без ограничений', () => {
    const { guard, context } = build([], Role.CLIENT);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('роль совпала → пускает', () => {
    const { guard, context } = build(
      [Role.PLATFORM_ADMIN],
      Role.PLATFORM_ADMIN,
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('одна из нескольких разрешённых → пускает', () => {
    const { guard, context } = build(
      [Role.RESTAURANT_OWNER, Role.RESTAURANT_STAFF],
      Role.RESTAURANT_STAFF,
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('роль не подходит → 403, а не 401', () => {
    const { guard, context } = build(
      [Role.PLATFORM_ADMIN],
      Role.RESTAURANT_OWNER,
    );

    expect(() => guard.canActivate(context)).toThrow(AccessDeniedError);
  });

  it('сотрудник ресторана не попадёт на платформенный эндпоинт', () => {
    const { guard, context } = build(
      [Role.PLATFORM_ADMIN],
      Role.RESTAURANT_STAFF,
    );

    expect(() => guard.canActivate(context)).toThrow(AccessDeniedError);
  });

  it('@Roles на публичном эндпоинте (пользователя нет) → не пускает', () => {
    const { guard, context } = build([Role.PLATFORM_ADMIN], undefined);

    expect(() => guard.canActivate(context)).toThrow(InvalidAccessTokenError);
  });
});
