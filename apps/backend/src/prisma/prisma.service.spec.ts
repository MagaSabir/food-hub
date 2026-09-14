import { Pool } from 'pg';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService(
      'postgresql://u:p@localhost:5432/foodhub',
      false,
    );
  });

  it('создаётся и имеет методы PrismaClient', () => {
    expect(service).toBeDefined();
    expect(typeof service.$connect).toBe('function');
    expect(typeof service.$disconnect).toBe('function');
  });

  describe('client / runInTransaction', () => {
    function fakeTransaction(tx: unknown) {
      return jest
        .spyOn(service, '$transaction')
        .mockImplementation((fn: unknown) =>
          (fn as (t: unknown) => Promise<unknown>)(tx),
        ) as unknown as jest.Mock;
    }

    it('вне транзакции client — сам PrismaService', () => {
      expect(service.client).toBe(service);
    });

    it('через client доступны делегаты моделей', () => {
      expect(service.client.user).toBeDefined();
      expect(typeof service.client.user.findFirst).toBe('function');
    });

    it('внутри транзакции client — транзакционный клиент', async () => {
      const tx = { marker: 'tx' };
      fakeTransaction(tx);

      const seen = await service.runInTransaction(() =>
        Promise.resolve(service.client),
      );

      expect(seen).toBe(tx);
      expect(service.client).toBe(service);
    });

    it('вложенный вызов переиспользует транзакцию, а не открывает вторую', async () => {
      const tx = { marker: 'tx' };
      const transaction = fakeTransaction(tx);

      const seen = await service.runInTransaction(() =>
        service.runInTransaction(() => Promise.resolve(service.client)),
      );

      expect(seen).toBe(tx);
      expect(transaction).toHaveBeenCalledTimes(1);
    });

    it('ошибка внутри пробрасывается наружу (транзакция откатится)', async () => {
      fakeTransaction({});
      const boom = new Error('boom');

      await expect(
        service.runInTransaction(() => Promise.reject(boom)),
      ).rejects.toBe(boom);
      expect(service.client).toBe(service);
    });
  });

  it('onModuleInit/onModuleDestroy: $connect, затем $disconnect + pool.end', async () => {
    const connect = jest
      .spyOn(service, '$connect')
      .mockResolvedValue(undefined);
    const disconnect = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValue(undefined);
    const holder = service as unknown as { pool: Pick<Pool, 'end'> };
    const poolEnd = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);
    holder.pool = { end: poolEnd };

    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(poolEnd).toHaveBeenCalledTimes(1);
  });
});
