import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  function build(queryRaw: jest.Mock, isAlive: jest.Mock) {
    return Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: { $queryRaw: queryRaw },
        },
        { provide: RedisService, useValue: { isAlive } },
      ],
    }).compile();
  }

  const dbUp = () => jest.fn().mockResolvedValue([{ '1': 1 }]);
  const dbDown = () => jest.fn().mockRejectedValue(new Error('no db'));
  const redisUp = () => jest.fn().mockResolvedValue(true);
  const redisDown = () => jest.fn().mockResolvedValue(false);

  it('БД и Redis живы → status ok', async () => {
    const moduleRef = await build(dbUp(), redisUp());
    const service = moduleRef.get(HealthService);

    const result = await service.check();
    expect(result.status).toBe('ok');
    expect(result.db).toBe('up');
    expect(result.redis).toBe('up');
    expect(typeof result.uptimeSec).toBe('number');
    expect(typeof result.timestamp).toBe('string');
  });

  it('БД лежит → status error', async () => {
    const moduleRef = await build(dbDown(), redisUp());
    const service = moduleRef.get(HealthService);

    const result = await service.check();
    expect(result.status).toBe('error');
    expect(result.db).toBe('down');
    expect(result.redis).toBe('up');
  });

  it('Redis лежит → status error (БД жива)', async () => {
    const moduleRef = await build(dbUp(), redisDown());
    const service = moduleRef.get(HealthService);

    const result = await service.check();
    expect(result.status).toBe('error');
    expect(result.db).toBe('up');
    expect(result.redis).toBe('down');
  });

  it('лежат обе → status error', async () => {
    const moduleRef = await build(dbDown(), redisDown());
    const service = moduleRef.get(HealthService);

    const result = await service.check();
    expect(result.status).toBe('error');
    expect(result.db).toBe('down');
    expect(result.redis).toBe('down');
  });
});
