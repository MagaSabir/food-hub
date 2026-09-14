import { Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisService } from './redis.service';

const makeCache = (
  over: { get?: jest.Mock; setex?: jest.Mock; del?: jest.Mock } = {},
) => {
  const get = over.get ?? jest.fn().mockResolvedValue(null);
  const setex = over.setex ?? jest.fn().mockResolvedValue('OK');
  const del = over.del ?? jest.fn().mockResolvedValue(1);
  const redis = { client: { get, setex, del } } as unknown as RedisService;
  return { cache: new CacheService(redis), get, setex, del };
};

describe('CacheService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  describe('wrap', () => {
    it('промах: зовёт loader, кладёт в кеш с TTL, возвращает значение', async () => {
      const { cache, setex } = makeCache();
      const loader = jest.fn().mockResolvedValue([{ id: 'r1' }]);

      await expect(cache.wrap('k', 60, loader)).resolves.toEqual([
        { id: 'r1' },
      ]);
      expect(loader).toHaveBeenCalledTimes(1);
      expect(setex).toHaveBeenCalledWith(
        'k',
        60,
        JSON.stringify([{ id: 'r1' }]),
      );
    });

    it('попадание: loader НЕ зовётся', async () => {
      const { cache, setex } = makeCache({
        get: jest.fn().mockResolvedValue(JSON.stringify([{ id: 'r1' }])),
      });
      const loader = jest.fn();

      await expect(cache.wrap('k', 60, loader)).resolves.toEqual([
        { id: 'r1' },
      ]);
      expect(loader).not.toHaveBeenCalled();
      expect(setex).not.toHaveBeenCalled();
    });

    it('null не кешируется («не найдено» — это 404, запоминать вредно)', async () => {
      const { cache, setex } = makeCache();
      await expect(
        cache.wrap('k', 60, () => Promise.resolve(null)),
      ).resolves.toBeNull();
      expect(setex).not.toHaveBeenCalled();
    });

    it('пустой массив — валидный результат, кешируется', async () => {
      const { cache, setex } = makeCache();
      await expect(
        cache.wrap('k', 60, () => Promise.resolve([])),
      ).resolves.toEqual([]);
      expect(setex).toHaveBeenCalled();
    });

    it('Redis лёг на ЧТЕНИИ → идём в базу, запрос не падает', async () => {
      const { cache } = makeCache({
        get: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      });

      await expect(
        cache.wrap('k', 60, () => Promise.resolve('из базы')),
      ).resolves.toBe('из базы');
    });

    it('Redis лёг на ЗАПИСИ → значение всё равно возвращается', async () => {
      const { cache } = makeCache({
        setex: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      });

      await expect(
        cache.wrap('k', 60, () => Promise.resolve('из базы')),
      ).resolves.toBe('из базы');
    });

    it('битое значение в ключе → читаем из базы, а не падаем', async () => {
      const { cache } = makeCache({
        get: jest.fn().mockResolvedValue('{не json'),
      });

      await expect(
        cache.wrap('k', 60, () => Promise.resolve('из базы')),
      ).resolves.toBe('из базы');
    });

    it('ошибка loader пробрасывается и ничего не кешируется', async () => {
      const { cache, setex } = makeCache();
      const boom = new Error('БД недоступна');

      await expect(
        cache.wrap('k', 60, () => Promise.reject(boom)),
      ).rejects.toBe(boom);
      expect(setex).not.toHaveBeenCalled();
    });
  });

  describe('invalidate', () => {
    it('удаляет переданные ключи', async () => {
      const { cache, del } = makeCache();
      await cache.invalidate('a', 'b');
      expect(del).toHaveBeenCalledWith('a', 'b');
    });

    it('без ключей в Redis не ходит', async () => {
      const { cache, del } = makeCache();
      await cache.invalidate();
      expect(del).not.toHaveBeenCalled();
    });

    it('сбой сброса не бросает — данные протухнут по TTL', async () => {
      const { cache } = makeCache({
        del: jest.fn().mockRejectedValue(new Error('нет связи')),
      });
      await expect(cache.invalidate('a')).resolves.toBeUndefined();
    });
  });
});
