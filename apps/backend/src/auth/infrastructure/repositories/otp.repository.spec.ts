import { RedisService } from '../../../redis/redis.service';
import { OtpPolicy } from '../../domain/policies/otp.policy';
import { OtpRepository } from './otp.repository';

describe('OtpRepository', () => {
  const PHONE = '+79280000000';

  function build(overrides: Record<string, unknown> = {}) {
    const calls: Array<[string, ...unknown[]]> = [];
    const chain = {
      set: (...args: unknown[]) => (calls.push(['set', ...args]), chain),
      del: (...args: unknown[]) => (calls.push(['del', ...args]), chain),
      exec: jest.fn().mockResolvedValue([]),
    };
    const client = {
      multi: () => chain,
      ttl: jest.fn().mockResolvedValue(-2),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      set: jest.fn().mockResolvedValue('OK'),
      ...overrides,
    };
    const repo = new OtpRepository({ client } as unknown as RedisService);

    return { repo, client, calls };
  }

  describe('startCooldown — захват кулдауна', () => {
    it('свободно → 0 и ключ ставится ОДНОЙ командой SET NX EX', async () => {
      const set = jest.fn().mockResolvedValue('OK');
      const { repo } = build({ set });

      await expect(repo.startCooldown(PHONE)).resolves.toBe(0);

      expect(set).toHaveBeenCalledWith(
        `otp:cooldown:${PHONE}`,
        '1',
        'EX',
        OtpPolicy.COOLDOWN_SEC,
        'NX',
      );
    });

    it('занято → отдаёт остаток по TTL, второй SMS не будет', async () => {
      const { repo } = build({
        set: jest.fn().mockResolvedValue(null),
        ttl: jest.fn().mockResolvedValue(42),
      });

      await expect(repo.startCooldown(PHONE)).resolves.toBe(42);
    });

    it('ключ истёк между SET и TTL → 1 секунда, а не «ждите 0»', async () => {
      const { repo } = build({
        set: jest.fn().mockResolvedValue(null),
        ttl: jest.fn().mockResolvedValue(-2),
      });

      await expect(repo.startCooldown(PHONE)).resolves.toBe(1);
    });
  });

  describe('releaseCooldown', () => {
    it('снимает кулдаун — на случай, если отправка не состоялась', async () => {
      const del = jest.fn().mockResolvedValue(1);
      const { repo } = build({ del });

      await repo.releaseCooldown(PHONE);

      expect(del).toHaveBeenCalledWith(`otp:cooldown:${PHONE}`);
    });
  });

  describe('cooldownLeftSec', () => {
    it('ключа нет (ttl -2) → 0, можно отправлять', async () => {
      const { repo } = build({ ttl: jest.fn().mockResolvedValue(-2) });

      await expect(repo.cooldownLeftSec(PHONE)).resolves.toBe(0);
    });

    it('ключ жив → возвращает остаток секунд', async () => {
      const { repo } = build({ ttl: jest.fn().mockResolvedValue(37) });

      await expect(repo.cooldownLeftSec(PHONE)).resolves.toBe(37);
    });
  });

  describe('incrementHourlyCount', () => {
    it('первый запрос → ставит TTL на час', async () => {
      const expire = jest.fn().mockResolvedValue(1);
      const { repo } = build({ incr: jest.fn().mockResolvedValue(1), expire });

      await repo.incrementHourlyCount(PHONE);

      expect(expire).toHaveBeenCalledWith(
        `otp:count:${PHONE}`,
        OtpPolicy.HOUR_SEC,
      );
    });

    it('последующие → TTL НЕ продлевает', async () => {
      const expire = jest.fn();
      const { repo } = build({ incr: jest.fn().mockResolvedValue(3), expire });

      await repo.incrementHourlyCount(PHONE);

      expect(expire).not.toHaveBeenCalled();
    });
  });

  describe('saveCode', () => {
    it('кладёт хеш с TTL кода и обнуляет попытки', async () => {
      const { repo, calls } = build();

      await repo.saveCode(PHONE, 'hashed');

      expect(calls).toEqual([
        ['set', `otp:code:${PHONE}`, 'hashed', 'EX', OtpPolicy.TTL_SEC],
        ['del', `otp:attempts:${PHONE}`],
      ]);
    });

    it('кулдаун НЕ трогает — его занимает startCooldown до отправки', async () => {
      const { repo, calls } = build();

      await repo.saveCode(PHONE, 'hashed');

      expect(calls.some(([, key]) => key === `otp:cooldown:${PHONE}`)).toBe(
        false,
      );
    });
  });

  describe('incrementAttempts', () => {
    it('первая попытка → TTL как у кода', async () => {
      const expire = jest.fn().mockResolvedValue(1);
      const { repo } = build({ incr: jest.fn().mockResolvedValue(1), expire });

      await expect(repo.incrementAttempts(PHONE)).resolves.toBe(1);
      expect(expire).toHaveBeenCalledWith(
        `otp:attempts:${PHONE}`,
        OtpPolicy.TTL_SEC,
      );
    });
  });

  describe('deleteCode', () => {
    it('гасит и код, и счётчик попыток', async () => {
      const del = jest.fn().mockResolvedValue(2);
      const { repo } = build({ del });

      await repo.deleteCode(PHONE);

      expect(del).toHaveBeenCalledWith(
        `otp:code:${PHONE}`,
        `otp:attempts:${PHONE}`,
      );
    });
  });
});
