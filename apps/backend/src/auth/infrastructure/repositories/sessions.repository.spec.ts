import { createHash } from 'node:crypto';
import { RedisService } from '../../../redis/redis.service';
import { AuthSubjectType } from '../../domain/types/auth-subject';
import { SessionsRepository, SessionState } from './sessions.repository';

function multiMock() {
  const calls: Array<[string, ...unknown[]]> = [];
  const chain = {
    set: (...args: unknown[]) => (calls.push(['set', ...args]), chain),
    sadd: (...args: unknown[]) => (calls.push(['sadd', ...args]), chain),
    expire: (...args: unknown[]) => (calls.push(['expire', ...args]), chain),
    del: (...args: unknown[]) => (calls.push(['del', ...args]), chain),
    srem: (...args: unknown[]) => (calls.push(['srem', ...args]), chain),
    exec: jest.fn().mockResolvedValue([]),
  };
  return { chain, calls };
}

describe('SessionsRepository', () => {
  const TYPE = AuthSubjectType.STAFF;
  const SUBJECT = 'staff-1';
  const SESSION = 'session-1';
  const TOKEN = 'refresh.jwt.token';
  const TOKEN_HASH = createHash('sha256').update(TOKEN).digest('hex');

  function build(clientOverrides: Record<string, unknown> = {}) {
    const { chain, calls } = multiMock();
    const client = {
      multi: () => chain,
      get: jest.fn().mockResolvedValue(null),
      smembers: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(1),
      ...clientOverrides,
    };
    const repo = new SessionsRepository({ client } as unknown as RedisService);
    return { repo, client, calls };
  }

  describe('save', () => {
    it('кладёт ХЕШ токена, а не сам токен', async () => {
      const { repo, calls } = build();

      await repo.save(TYPE, SUBJECT, SESSION, TOKEN, 100);

      const set = calls.find((c) => c[0] === 'set')!;
      expect(set[2]).toBe(TOKEN_HASH);
      expect(set).not.toContain(TOKEN);
    });

    it('ключ содержит тип субъекта, его id и id сессии', async () => {
      const { repo, calls } = build();

      await repo.save(TYPE, SUBJECT, SESSION, TOKEN, 100);

      const set = calls.find((c) => c[0] === 'set')!;
      expect(set[1]).toBe('session:staff:staff-1:session-1');
    });

    it('ставит TTL — протухшая сессия удалится сама', async () => {
      const { repo, calls } = build();

      await repo.save(TYPE, SUBJECT, SESSION, TOKEN, 3600);

      const set = calls.find((c) => c[0] === 'set')!;
      expect(set[3]).toBe('EX');
      expect(set[4]).toBe(3600);
    });

    it('добавляет сессию в индекс субъекта (для гашения всех разом)', async () => {
      const { repo, calls } = build();

      await repo.save(TYPE, SUBJECT, SESSION, TOKEN, 100);

      expect(calls.find((c) => c[0] === 'sadd')).toEqual([
        'sadd',
        'sessions:staff:staff-1',
        SESSION,
      ]);
    });
  });

  describe('check — три состояния, а не два', () => {
    it('хеш совпал → CURRENT', async () => {
      const { repo } = build({
        get: jest.fn().mockResolvedValue(TOKEN_HASH),
      });

      await expect(repo.check(TYPE, SUBJECT, SESSION, TOKEN)).resolves.toBe(
        SessionState.CURRENT,
      );
    });

    it('сессии нет (выход, срок, вытеснена) → MISSING', async () => {
      const { repo } = build({ get: jest.fn().mockResolvedValue(null) });

      await expect(repo.check(TYPE, SUBJECT, SESSION, TOKEN)).resolves.toBe(
        SessionState.MISSING,
      );
    });

    it('сессия жива, но хеш ДРУГОГО токена → STALE', async () => {
      const { repo } = build({
        get: jest
          .fn()
          .mockResolvedValue(
            createHash('sha256').update('other.token').digest('hex'),
          ),
      });

      await expect(repo.check(TYPE, SUBJECT, SESSION, TOKEN)).resolves.toBe(
        SessionState.STALE,
      );
    });
  });

  describe('deleteAllForSubject', () => {
    it('удаляет все сессии субъекта вместе с индексом', async () => {
      const del = jest.fn().mockResolvedValue(3);
      const { repo } = build({
        smembers: jest.fn().mockResolvedValue(['s1', 's2']),
        del,
      });

      await repo.deleteAllForSubject(TYPE, SUBJECT);

      expect(del).toHaveBeenCalledWith(
        'session:staff:staff-1:s1',
        'session:staff:staff-1:s2',
        'sessions:staff:staff-1',
      );
    });
  });
});
