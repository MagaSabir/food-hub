import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { RedisService } from '../redis/redis.service';
import { buildThrottlerOptions } from './throttler-options.factory';

describe('buildThrottlerOptions', () => {
  const redis = new RedisService('redis://localhost:6379');

  it('переводит ttl из секунд в миллисекунды и сохраняет limit', () => {
    const options = buildThrottlerOptions({ ttl: 60, limit: 100 }, redis);

    expect(options.throttlers).toEqual([{ ttl: 60_000, limit: 100 }]);
  });

  it('счётчики — в Redis, не в памяти процесса', () => {
    const options = buildThrottlerOptions({ ttl: 60, limit: 100 }, redis);

    expect(options.storage).toBeInstanceOf(ThrottlerStorageRedisService);
  });

  it('переиспользует наше подключение, а не создаёт своё', () => {
    const options = buildThrottlerOptions({ ttl: 60, limit: 100 }, redis);
    const storage = options.storage as ThrottlerStorageRedisService;

    expect(storage.redis).toBe(redis.client);
    expect(storage.disconnectRequired).toBeFalsy();
  });
});
