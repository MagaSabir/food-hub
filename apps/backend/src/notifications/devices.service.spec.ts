import { Prisma } from '@prisma/client';
import { DevicesService } from './devices.service';
import { PrismaService } from '../prisma/prisma.service';

const TOKEN = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';

const makeService = () => {
  const upsert = jest
    .fn<Promise<unknown>, [Prisma.UserDeviceUpsertArgs]>()
    .mockResolvedValue({});
  const findMany = jest.fn().mockResolvedValue([]);
  const deleteMany = jest.fn().mockResolvedValue({ count: 0 });

  const prisma = {
    client: { userDevice: { upsert, findMany, deleteMany } },
  } as unknown as PrismaService;

  return { service: new DevicesService(prisma), upsert, findMany, deleteMany };
};

describe('DevicesService', () => {
  describe('register', () => {
    it('ищет строку ПО ТОКЕНУ, а не по паре «человек + токен»', async () => {
      const { service, upsert } = makeService();

      await service.register('user-1', TOKEN, 'ios');

      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { expoPushToken: TOKEN } }),
      );
    });

    it('перевешивает устройство на текущего владельца', async () => {
      const { service, upsert } = makeService();

      await service.register('user-2', TOKEN, 'android');

      const { update } = upsert.mock.calls[0][0];
      expect(update).toMatchObject({ userId: 'user-2', platform: 'android' });
      expect(update.lastActiveAt).toBeInstanceOf(Date);
    });

    it('платформа необязательна', async () => {
      const { service, upsert } = makeService();

      await service.register('user-1', TOKEN, undefined);

      expect(upsert.mock.calls[0][0].create).toEqual({
        userId: 'user-1',
        expoPushToken: TOKEN,
        platform: undefined,
      });
    });
  });

  describe('tokensOf', () => {
    it('отдаёт адреса всех устройств человека', async () => {
      const { service, findMany } = makeService();
      findMany.mockResolvedValue([
        { expoPushToken: 'a' },
        { expoPushToken: 'b' },
      ]);

      await expect(service.tokensOf('user-1')).resolves.toEqual(['a', 'b']);
      expect(findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { expoPushToken: true },
      });
    });
  });

  describe('forget', () => {
    it('удаляет пачкой', async () => {
      const { service, deleteMany } = makeService();

      await service.forget(['a', 'b']);

      expect(deleteMany).toHaveBeenCalledWith({
        where: { expoPushToken: { in: ['a', 'b'] } },
      });
    });

    it('на пустом списке в базу не ходит', async () => {
      const { service, deleteMany } = makeService();

      await service.forget([]);

      expect(deleteMany).not.toHaveBeenCalled();
    });
  });
});
