import { RedisService } from '../../../redis/redis.service';
import { AuthSubjectType } from '../../domain/types/auth-subject';
import { LoginPolicy } from '../../domain/policies/login.policy';
import { LoginAttemptsRepository } from './login-attempts.repository';

describe('LoginAttemptsRepository', () => {
  const EMAIL = 'admin@foodhub.local';
  const KEY = `login:fails:${AuthSubjectType.ADMIN}:${EMAIL}`;

  function build(overrides: Record<string, unknown> = {}) {
    const client = {
      get: jest.fn().mockResolvedValue(null),
      ttl: jest.fn().mockResolvedValue(-2),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      del: jest.fn().mockResolvedValue(1),
      ...overrides,
    };
    const repo = new LoginAttemptsRepository({
      client,
    } as unknown as RedisService);

    return { repo, client };
  }

  describe('lockedForSec', () => {
    it('попыток не было → 0, вход разрешён', async () => {
      const { repo } = build();

      await expect(
        repo.lockedForSec(AuthSubjectType.ADMIN, EMAIL),
      ).resolves.toBe(0);
    });

    it('попыток меньше лимита → 0', async () => {
      const { repo } = build({
        get: jest.fn().mockResolvedValue(String(LoginPolicy.MAX_ATTEMPTS - 1)),
        ttl: jest.fn().mockResolvedValue(500),
      });

      await expect(
        repo.lockedForSec(AuthSubjectType.ADMIN, EMAIL),
      ).resolves.toBe(0);
    });

    it('лимит достигнут → остаток окна по TTL', async () => {
      const { repo } = build({
        get: jest.fn().mockResolvedValue(String(LoginPolicy.MAX_ATTEMPTS)),
        ttl: jest.fn().mockResolvedValue(300),
      });

      await expect(
        repo.lockedForSec(AuthSubjectType.ADMIN, EMAIL),
      ).resolves.toBe(300);
    });

    it('ключ истёк между двумя командами → 0, не держим зря', async () => {
      const { repo } = build({
        get: jest.fn().mockResolvedValue(String(LoginPolicy.MAX_ATTEMPTS)),
        ttl: jest.fn().mockResolvedValue(-2),
      });

      await expect(
        repo.lockedForSec(AuthSubjectType.ADMIN, EMAIL),
      ).resolves.toBe(0);
    });
  });

  describe('registerFailure', () => {
    it('первая неудача → ставит TTL окна', async () => {
      const expire = jest.fn().mockResolvedValue(1);
      const { repo } = build({ incr: jest.fn().mockResolvedValue(1), expire });

      await repo.registerFailure(AuthSubjectType.ADMIN, EMAIL);

      expect(expire).toHaveBeenCalledWith(KEY, LoginPolicy.WINDOW_SEC);
    });

    it('последующие TTL НЕ продлевают', async () => {
      const expire = jest.fn();
      const { repo } = build({ incr: jest.fn().mockResolvedValue(3), expire });

      await repo.registerFailure(AuthSubjectType.ADMIN, EMAIL);

      expect(expire).not.toHaveBeenCalled();
    });
  });

  it('email нечувствителен к регистру — иначе лимит обходится сменой букв', async () => {
    const incr = jest.fn().mockResolvedValue(1);
    const { repo } = build({ incr });

    await repo.registerFailure(AuthSubjectType.ADMIN, 'Admin@FoodHub.Local');

    expect(incr).toHaveBeenCalledWith(KEY);
  });

  it('reset стирает счётчик', async () => {
    const del = jest.fn().mockResolvedValue(1);
    const { repo } = build({ del });

    await repo.reset(AuthSubjectType.ADMIN, EMAIL);

    expect(del).toHaveBeenCalledWith(KEY);
  });
});
