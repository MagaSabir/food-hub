import { Test } from '@nestjs/testing';
import {
  OtpLimitExceededError,
  OtpTooSoonError,
} from '../../domain/errors/auth.errors';
import { OtpPolicy } from '../../domain/policies/otp.policy';
import { OtpRepository } from '../../infrastructure/repositories/otp.repository';
import { OTP_SENDER } from '../../infrastructure/otp-sender/otp-sender.interface';
import { PasswordHasher } from '../../infrastructure/crypto/password-hasher';
import { RequestOtpCommand, RequestOtpUseCase } from './request-otp.usecase';

const PHONE = '+79280000000';

describe('RequestOtpUseCase', () => {
  let useCase: RequestOtpUseCase;
  let startCooldown: jest.Mock;
  let releaseCooldown: jest.Mock;
  let incrementHourlyCount: jest.Mock;
  let addCode: jest.Mock<Promise<void>, [string, string]>;
  let hash: jest.Mock;
  let send: jest.Mock<Promise<void>, [string, string, string]>;

  beforeEach(async () => {
    startCooldown = jest.fn().mockResolvedValue(0);
    releaseCooldown = jest.fn().mockResolvedValue(undefined);
    incrementHourlyCount = jest.fn().mockResolvedValue(1);
    addCode = jest.fn<Promise<void>, [string, string]>().mockResolvedValue();
    hash = jest.fn().mockResolvedValue('$argon2id$hashed');
    send = jest
      .fn<Promise<void>, [string, string, string]>()
      .mockResolvedValue();

    const moduleRef = await Test.createTestingModule({
      providers: [
        RequestOtpUseCase,
        {
          provide: OtpRepository,
          useValue: {
            startCooldown,
            releaseCooldown,
            incrementHourlyCount,
            addCode,
          },
        },
        { provide: PasswordHasher, useValue: { hash } },
        { provide: OTP_SENDER, useValue: { send } },
      ],
    }).compile();

    useCase = moduleRef.get(RequestOtpUseCase);
  });

  const request = (channel?: 'auto' | 'sms') =>
    useCase.execute(new RequestOtpCommand(PHONE, channel ?? 'auto'));

  const sentCode = (): string => send.mock.calls[0][1];

  describe('канал доставки (Шаг 6.3)', () => {
    it('по умолчанию решает сервер', async () => {
      await request();

      expect(send.mock.calls[0][2]).toBe('auto');
    });

    it('«не пришёл код» доезжает до отправителя', async () => {
      await request('sms');

      expect(send.mock.calls[0][2]).toBe('sms');
    });

    it('код ДОБАВЛЯЕТСЯ к действующим, а не заменяет их', async () => {
      await request('sms');

      expect(addCode).toHaveBeenCalledTimes(1);
      expect(addCode.mock.calls[0][0]).toBe(PHONE);
    });
  });

  describe('обычный запрос', () => {
    it('отправляет код и возвращает тайминги', async () => {
      const result = await request();

      expect(send).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        cooldownSec: OtpPolicy.COOLDOWN_SEC,
        expiresInSec: OtpPolicy.TTL_SEC,
      });
    });

    it('код нужной длины (из политики)', async () => {
      await request();

      expect(sentCode()).toMatch(new RegExp(`^\\d{${OtpPolicy.CODE_LENGTH}}$`));
    });

    it('коды не повторяются', async () => {
      const codes = new Set<string>();
      for (let i = 0; i < 20; i++) {
        send.mockClear();
        await request();
        codes.add(sentCode());
      }

      expect(codes.size).toBeGreaterThan(15);
    });

    it('в Redis уходит ХЕШ, а не сам код', async () => {
      await request();

      expect(hash).toHaveBeenCalledWith(sentCode());
      expect(addCode).toHaveBeenCalledWith(PHONE, '$argon2id$hashed');
    });
  });

  describe('кулдаун между отправками', () => {
    it('не истёк → ошибка с остатком времени', async () => {
      startCooldown.mockResolvedValue(42);

      const error = (await request().catch(
        (e: unknown) => e,
      )) as OtpTooSoonError;

      expect(error).toBeInstanceOf(OtpTooSoonError);
      expect(error.retryAfterSec).toBe(42);
    });

    it('код НЕ отправляется и НЕ перезаписывается', async () => {
      startCooldown.mockResolvedValue(42);

      await request().catch(() => undefined);

      expect(send).not.toHaveBeenCalled();
      expect(addCode).not.toHaveBeenCalled();
      expect(incrementHourlyCount).not.toHaveBeenCalled();
    });
  });

  describe('часовой лимит на номер', () => {
    it('в пределах лимита пропускает', async () => {
      incrementHourlyCount.mockResolvedValue(OtpPolicy.MAX_PER_HOUR);

      await expect(request()).resolves.toBeDefined();
    });

    it('сверх лимита → ошибка, код не уходит', async () => {
      incrementHourlyCount.mockResolvedValue(OtpPolicy.MAX_PER_HOUR + 1);

      await expect(request()).rejects.toBeInstanceOf(OtpLimitExceededError);
      expect(send).not.toHaveBeenCalled();
      expect(addCode).not.toHaveBeenCalled();
    });
  });

  describe('кулдаун занимается ДО отправки и снимается при сбое', () => {
    it('удачная отправка кулдаун не снимает', async () => {
      await request();

      expect(startCooldown).toHaveBeenCalledWith(PHONE);
      expect(releaseCooldown).not.toHaveBeenCalled();
    });

    it('упал отправитель → кулдаун снят: человек кода не получил', async () => {
      send.mockRejectedValue(new Error('sms provider down'));

      await expect(request()).rejects.toThrow('sms provider down');

      expect(releaseCooldown).toHaveBeenCalledWith(PHONE);
    });

    it('часовой лимит → кулдаун тоже снят', async () => {
      incrementHourlyCount.mockResolvedValue(OtpPolicy.MAX_PER_HOUR + 1);

      await request().catch(() => undefined);

      expect(releaseCooldown).toHaveBeenCalledWith(PHONE);
    });
  });

  it('существование номера НЕ проверяется — ответ одинаков для всех', async () => {
    const result = await request();

    expect(result.cooldownSec).toBe(OtpPolicy.COOLDOWN_SEC);
  });
});
