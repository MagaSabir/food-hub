import { AuthScope } from '@foodhubme/shared';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AccessTokenPayload } from '../../domain/types/access-token-payload';
import { AuthSubjectType, AuthTokens } from '../../domain/types/auth-subject';
import {
  InvalidCredentialsError,
  LoginAttemptsExceededError,
} from '../../domain/errors/auth.errors';
import { LoginAttemptsRepository } from '../../infrastructure/repositories/login-attempts.repository';
import { PasswordHasher } from '../../infrastructure/crypto/password-hasher';
import { PlatformAdminsRepository } from '../../infrastructure/repositories/platform-admins.repository';
import { SessionsRepository } from '../../infrastructure/repositories/sessions.repository';
import { StaffUsersRepository } from '../../infrastructure/repositories/staff-users.repository';
import { SessionIssuer } from '../services/session-issuer.service';
import { LoginCommand, LoginUseCase } from './login.usecase';

const ADMIN = {
  id: 'admin-1',
  email: 'admin@foodhub.local',
  passwordHash: 'hash-admin',
};

const STAFF = {
  id: 'staff-1',
  email: 'owner@syrovarnya.local',
  passwordHash: 'hash-staff',
  role: Role.RESTAURANT_OWNER,
  restaurantId: 'restaurant-1',
  branchId: null,
};

const TOKENS: AuthTokens = {
  accessToken: 'access.jwt',
  refreshToken: 'refresh.jwt',
  refreshTtlSec: 2_592_000,
};

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let findAdmin: jest.Mock;
  let findStaff: jest.Mock;
  let verify: jest.Mock<Promise<boolean>, [string, string]>;
  let deleteAllForSubject: jest.Mock<Promise<void>, [AuthSubjectType, string]>;
  let issue: jest.Mock<
    Promise<AuthTokens>,
    [AuthSubjectType, AccessTokenPayload]
  >;
  let lockedForSec: jest.Mock;
  let registerFailure: jest.Mock;
  let resetAttempts: jest.Mock;

  beforeEach(async () => {
    lockedForSec = jest.fn().mockResolvedValue(0);
    registerFailure = jest.fn().mockResolvedValue(undefined);
    resetAttempts = jest.fn().mockResolvedValue(undefined);
    findAdmin = jest.fn().mockResolvedValue(null);
    findStaff = jest.fn().mockResolvedValue(null);
    verify = jest
      .fn<Promise<boolean>, [string, string]>()
      .mockResolvedValue(false);
    deleteAllForSubject = jest
      .fn<Promise<void>, [AuthSubjectType, string]>()
      .mockResolvedValue(undefined);
    issue = jest
      .fn<Promise<AuthTokens>, [AuthSubjectType, AccessTokenPayload]>()
      .mockResolvedValue(TOKENS);

    const moduleRef = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: StaffUsersRepository,
          useValue: { findActiveByEmail: findStaff },
        },
        {
          provide: PlatformAdminsRepository,
          useValue: { findActiveByEmail: findAdmin },
        },
        { provide: PasswordHasher, useValue: { verify } },
        { provide: SessionsRepository, useValue: { deleteAllForSubject } },
        { provide: SessionIssuer, useValue: { issue } },
        {
          provide: LoginAttemptsRepository,
          useValue: { lockedForSec, registerFailure, reset: resetAttempts },
        },
      ],
    }).compile();

    useCase = moduleRef.get(LoginUseCase);
  });

  const login = (scope: AuthScope, password = 'Admin12345!') =>
    useCase.execute(new LoginCommand({ email: ADMIN.email, password, scope }));

  const loginFailure = async (scope: AuthScope): Promise<Error> =>
    (await login(scope).catch((e: unknown) => e)) as Error;

  describe('админ платформы', () => {
    it('верный пароль → пара токенов, роль PLATFORM_ADMIN', async () => {
      findAdmin.mockResolvedValue(ADMIN);
      verify.mockResolvedValue(true);

      const result = await login(AuthScope.PLATFORM);

      expect(result).toEqual(TOKENS);
      expect(issue).toHaveBeenCalledWith(AuthSubjectType.ADMIN, {
        sub: ADMIN.id,
        role: Role.PLATFORM_ADMIN,
      });
    });
  });

  describe('сотрудник ресторана', () => {
    it('в токене роль и принадлежность из БД', async () => {
      findStaff.mockResolvedValue(STAFF);
      verify.mockResolvedValue(true);

      await login(AuthScope.RESTAURANT);

      expect(issue).toHaveBeenCalledWith(AuthSubjectType.STAFF, {
        sub: STAFF.id,
        role: Role.RESTAURANT_OWNER,
        restaurantId: STAFF.restaurantId,
        branchId: null,
      });
    });
  });

  describe('одно устройство (MVP)', () => {
    it('вход гасит прошлые сессии этого аккаунта', async () => {
      findStaff.mockResolvedValue(STAFF);
      verify.mockResolvedValue(true);

      await login(AuthScope.RESTAURANT);

      expect(deleteAllForSubject).toHaveBeenCalledWith(
        AuthSubjectType.STAFF,
        STAFF.id,
      );
    });

    it('гасит ДО выдачи новой пары, иначе снесёт свежую сессию', async () => {
      findStaff.mockResolvedValue(STAFF);
      verify.mockResolvedValue(true);

      const order: string[] = [];
      deleteAllForSubject.mockImplementation(() => {
        order.push('delete');
        return Promise.resolve();
      });
      issue.mockImplementation(() => {
        order.push('issue');
        return Promise.resolve(TOKENS);
      });

      await login(AuthScope.RESTAURANT);

      expect(order).toEqual(['delete', 'issue']);
    });

    it('при неудачном входе чужие сессии не трогаем', async () => {
      findStaff.mockResolvedValue(null);

      await login(AuthScope.RESTAURANT).catch(() => undefined);

      expect(deleteAllForSubject).not.toHaveBeenCalled();
    });
  });

  describe('отказы — один ответ на все причины', () => {
    it('нет такого email → InvalidCredentials', async () => {
      findAdmin.mockResolvedValue(null);

      await expect(login(AuthScope.PLATFORM)).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
    });

    it('неверный пароль → InvalidCredentials', async () => {
      findAdmin.mockResolvedValue(ADMIN);
      verify.mockResolvedValue(false);

      await expect(login(AuthScope.PLATFORM)).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
    });

    it('текст ошибки одинаковый и не выдаёт, что именно не так', async () => {
      findAdmin.mockResolvedValue(null);
      const missing = await loginFailure(AuthScope.PLATFORM);

      findAdmin.mockResolvedValue(ADMIN);
      verify.mockResolvedValue(false);
      const wrongPassword = await loginFailure(AuthScope.PLATFORM);

      expect(missing.message).toBe(wrongPassword.message);
      expect(missing.message).toBe('Неверный email или пароль');
    });

    it('когда email не найден, пароль всё равно сверяется (защита по времени)', async () => {
      findAdmin.mockResolvedValue(null);

      await login(AuthScope.PLATFORM).catch(() => undefined);

      expect(verify).toHaveBeenCalledTimes(1);
      expect(verify.mock.calls[0][0]).toContain('$argon2id$');
    });

    it('токены не выдаются при неудачном входе', async () => {
      findAdmin.mockResolvedValue(null);

      await login(AuthScope.PLATFORM).catch(() => undefined);

      expect(issue).not.toHaveBeenCalled();
    });
  });

  describe('scope выбирает таблицу', () => {
    it('platform не ищет среди сотрудников', async () => {
      findAdmin.mockResolvedValue(ADMIN);
      verify.mockResolvedValue(true);

      await login(AuthScope.PLATFORM);

      expect(findStaff).not.toHaveBeenCalled();
    });

    it('сотрудник со scope=platform войти НЕ может', async () => {
      findStaff.mockResolvedValue(STAFF);
      findAdmin.mockResolvedValue(null);

      await expect(login(AuthScope.PLATFORM)).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
    });
  });

  describe('защита от перебора пароля (лимит на АККАУНТ)', () => {
    it('неудачный вход засчитывается', async () => {
      findAdmin.mockResolvedValue(ADMIN);
      verify.mockResolvedValue(false);

      await loginFailure(AuthScope.PLATFORM);

      expect(registerFailure).toHaveBeenCalledWith(
        AuthSubjectType.ADMIN,
        ADMIN.email,
      );
    });

    it('несуществующий email тоже засчитывается', async () => {
      findAdmin.mockResolvedValue(null);

      await loginFailure(AuthScope.PLATFORM);

      expect(registerFailure).toHaveBeenCalledTimes(1);
    });

    it('лимит исчерпан → 429 с остатком, пароль даже не сверяется', async () => {
      lockedForSec.mockResolvedValue(300);

      const error = (await loginFailure(
        AuthScope.PLATFORM,
      )) as LoginAttemptsExceededError;

      expect(error).toBeInstanceOf(LoginAttemptsExceededError);
      expect(error.retryAfterSec).toBe(300);
      expect(verify).not.toHaveBeenCalled();
      expect(findAdmin).not.toHaveBeenCalled();
    });

    it('удачный вход обнуляет счётчик', async () => {
      findAdmin.mockResolvedValue(ADMIN);
      verify.mockResolvedValue(true);

      await login(AuthScope.PLATFORM);

      expect(resetAttempts).toHaveBeenCalledWith(
        AuthSubjectType.ADMIN,
        ADMIN.email,
      );
      expect(registerFailure).not.toHaveBeenCalled();
    });

    it('счётчики сотрудников и админов раздельные', async () => {
      findStaff.mockResolvedValue(null);

      await loginFailure(AuthScope.RESTAURANT);

      expect(registerFailure).toHaveBeenCalledWith(
        AuthSubjectType.STAFF,
        ADMIN.email,
      );
    });
  });
});
