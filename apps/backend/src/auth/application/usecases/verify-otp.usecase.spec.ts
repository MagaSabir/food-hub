import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AuthSubjectType, AuthTokens } from '../../domain/types/auth-subject';
import {
  InvalidOtpError,
  OtpAttemptsExceededError,
} from '../../domain/errors/auth.errors';
import { OtpPolicy } from '../../domain/policies/otp.policy';
import { OtpRepository } from '../../infrastructure/repositories/otp.repository';
import { PasswordHasher } from '../../infrastructure/crypto/password-hasher';
import { SessionsRepository } from '../../infrastructure/repositories/sessions.repository';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';
import { SessionIssuer } from '../services/session-issuer.service';
import { VerifyOtpCommand, VerifyOtpUseCase } from './verify-otp.usecase';

const PHONE = '+79280000000';
const CODE = '12345';
const USER = { id: 'user-1', phone: PHONE, name: null };

const TOKENS: AuthTokens = {
  accessToken: 'access',
  refreshToken: 'refresh',
  refreshTtlSec: 100,
};

describe('VerifyOtpUseCase', () => {
  let useCase: VerifyOtpUseCase;
  let findCodeHashes: jest.Mock;
  let incrementAttempts: jest.Mock;
  let deleteCode: jest.Mock;
  let verify: jest.Mock;
  let findOrCreateByPhone: jest.Mock;
  let deleteAllForSubject: jest.Mock;
  let issue: jest.Mock;

  beforeEach(async () => {
    findCodeHashes = jest.fn().mockResolvedValue(['$argon2id$stored']);
    incrementAttempts = jest.fn().mockResolvedValue(1);
    deleteCode = jest.fn().mockResolvedValue(undefined);
    verify = jest.fn().mockResolvedValue(true);
    findOrCreateByPhone = jest.fn().mockResolvedValue(USER);
    deleteAllForSubject = jest.fn().mockResolvedValue(undefined);
    issue = jest.fn().mockResolvedValue(TOKENS);

    const moduleRef = await Test.createTestingModule({
      providers: [
        VerifyOtpUseCase,
        {
          provide: OtpRepository,
          useValue: { findCodeHashes, incrementAttempts, deleteCode },
        },
        { provide: PasswordHasher, useValue: { verify } },
        { provide: UsersRepository, useValue: { findOrCreateByPhone } },
        { provide: SessionsRepository, useValue: { deleteAllForSubject } },
        { provide: SessionIssuer, useValue: { issue } },
      ],
    }).compile();

    useCase = moduleRef.get(VerifyOtpUseCase);
  });

  const verifyOtp = () => useCase.execute(new VerifyOtpCommand(PHONE, CODE));

  describe('два действующих кода (Шаг 6.3)', () => {
    it('подходит СВЕЖИЙ — на нём проверка и заканчивается', async () => {
      findCodeHashes.mockResolvedValue(['$argon2id$new', '$argon2id$old']);
      verify.mockImplementation((hash: string) =>
        Promise.resolve(hash === '$argon2id$new'),
      );

      await expect(verifyOtp()).resolves.toEqual(TOKENS);

      expect(verify).toHaveBeenCalledTimes(1);
    });

    it('подходит СТАРЫЙ — ради этого шаг и делался', async () => {
      findCodeHashes.mockResolvedValue(['$argon2id$new', '$argon2id$old']);
      verify.mockImplementation((hash: string) =>
        Promise.resolve(hash === '$argon2id$old'),
      );

      await expect(verifyOtp()).resolves.toEqual(TOKENS);
      expect(verify).toHaveBeenCalledTimes(2);
    });

    it('не подошёл ни один → отказ, попытка засчитана', async () => {
      findCodeHashes.mockResolvedValue(['$argon2id$new', '$argon2id$old']);
      verify.mockResolvedValue(false);

      await expect(verifyOtp()).rejects.toBeInstanceOf(InvalidOtpError);
      expect(incrementAttempts).toHaveBeenCalledWith(PHONE);
    });

    it('вход гасит ОБА кода', async () => {
      findCodeHashes.mockResolvedValue(['$argon2id$new', '$argon2id$old']);

      await verifyOtp();

      expect(deleteCode).toHaveBeenCalledWith(PHONE);
    });
  });

  describe('верный код', () => {
    it('возвращает пару токенов', async () => {
      await expect(verifyOtp()).resolves.toEqual(TOKENS);
    });

    it('роль CLIENT, без принадлежности к ресторану', async () => {
      await verifyOtp();

      expect(issue).toHaveBeenCalledWith(AuthSubjectType.CLIENT, {
        sub: USER.id,
        role: Role.CLIENT,
      });
    });

    it('код гасится — повторно войти им нельзя', async () => {
      await verifyOtp();

      expect(deleteCode).toHaveBeenCalledWith(PHONE);
    });

    it('заводит или находит клиента по номеру (отложенная регистрация)', async () => {
      await verifyOtp();

      expect(findOrCreateByPhone).toHaveBeenCalledWith(PHONE);
    });

    it('гасит прошлые сессии клиента (одно устройство)', async () => {
      await verifyOtp();

      expect(deleteAllForSubject).toHaveBeenCalledWith(
        AuthSubjectType.CLIENT,
        USER.id,
      );
    });
  });

  describe('неверный код', () => {
    it('→ InvalidOtp, клиент не создаётся', async () => {
      verify.mockResolvedValue(false);

      await expect(verifyOtp()).rejects.toBeInstanceOf(InvalidOtpError);
      expect(findOrCreateByPhone).not.toHaveBeenCalled();
      expect(issue).not.toHaveBeenCalled();
    });

    it('код НЕ гасится — попытки ещё остались', async () => {
      verify.mockResolvedValue(false);

      await verifyOtp().catch(() => undefined);

      expect(deleteCode).not.toHaveBeenCalled();
    });
  });

  describe('кода нет (не запрашивали, истёк, уже использован)', () => {
    it('→ та же ошибка, что при неверном коде', async () => {
      findCodeHashes.mockResolvedValue([]);

      const error = await verifyOtp().catch((e: unknown) => e as Error);

      expect(error).toBeInstanceOf(InvalidOtpError);
      expect((error as Error).message).toBe('Неверный код');
    });

    it('попытка не засчитывается — считать нечего', async () => {
      findCodeHashes.mockResolvedValue([]);

      await verifyOtp().catch(() => undefined);

      expect(incrementAttempts).not.toHaveBeenCalled();
    });
  });

  describe('попытки ввода', () => {
    it('считаются ДО сверки кода', async () => {
      const order: string[] = [];
      incrementAttempts.mockImplementation(() => {
        order.push('increment');
        return Promise.resolve(1);
      });
      verify.mockImplementation(() => {
        order.push('verify');
        return Promise.resolve(true);
      });

      await verifyOtp();

      expect(order).toEqual(['increment', 'verify']);
    });

    it('последняя разрешённая попытка ещё проходит', async () => {
      incrementAttempts.mockResolvedValue(OtpPolicy.MAX_ATTEMPTS);

      await expect(verifyOtp()).resolves.toEqual(TOKENS);
    });

    it('сверх лимита → код гасится, даже если введён верно', async () => {
      incrementAttempts.mockResolvedValue(OtpPolicy.MAX_ATTEMPTS + 1);

      await expect(verifyOtp()).rejects.toBeInstanceOf(
        OtpAttemptsExceededError,
      );
      expect(deleteCode).toHaveBeenCalledWith(PHONE);
      expect(verify).not.toHaveBeenCalled();
      expect(issue).not.toHaveBeenCalled();
    });
  });
});
