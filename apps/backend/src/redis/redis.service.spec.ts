import Redis from 'ioredis';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(() => {
    service = new RedisService('redis://localhost:6379');
  });

  function stubClient(stub: Partial<Redis>): void {
    Object.assign(service.client, stub);
  }

  it('создаётся, клиент не подключается сам', () => {
    expect(service).toBeDefined();
    expect(service.client.status).not.toBe('ready');
  });

  it('onModuleInit: подключается', async () => {
    const connect = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);
    stubClient({ connect });

    await service.onModuleInit();
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('onModuleInit: Redis недоступен → пробрасывает ошибку (старт прерывается)', async () => {
    const connect = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    stubClient({ connect });

    await expect(service.onModuleInit()).rejects.toThrow('ECONNREFUSED');
  });

  it('onModuleDestroy: закрывает соединение', async () => {
    const quit = jest.fn<Promise<'OK'>, []>().mockResolvedValue('OK');
    stubClient({ quit });

    await service.onModuleDestroy();
    expect(quit).toHaveBeenCalledTimes(1);
  });

  it('isAlive: PONG → true', async () => {
    stubClient({ ping: jest.fn().mockResolvedValue('PONG') });
    await expect(service.isAlive()).resolves.toBe(true);
  });

  it('isAlive: ошибка соединения → false, наружу не бросает', async () => {
    stubClient({
      ping: jest.fn().mockRejectedValue(new Error('connection lost')),
    });
    await expect(service.isAlive()).resolves.toBe(false);
  });
});
