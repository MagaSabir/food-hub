import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthResult, HealthService } from './health.service';

describe('HealthController', () => {
  async function build(result: HealthResult) {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: { check: jest.fn().mockResolvedValue(result) },
        },
      ],
    }).compile();
    return moduleRef.get(HealthController);
  }

  it('здоров → возвращает результат', async () => {
    const ok: HealthResult = {
      status: 'ok',
      db: 'up',
      redis: 'up',
      uptimeSec: 1,
      timestamp: 't',
    };
    const controller = await build(ok);
    await expect(controller.check()).resolves.toEqual(ok);
  });

  it('зависимость недоступна → 503 (ServiceUnavailable)', async () => {
    const bad: HealthResult = {
      status: 'error',
      db: 'down',
      redis: 'up',
      uptimeSec: 1,
      timestamp: 't',
    };
    const controller = await build(bad);
    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
