import { MAX_SAVED_ADDRESSES } from '@foodhubme/shared';
import { AddressesService } from './addresses.service';
import {
  AddressLimitReachedError,
  AddressNotFoundError,
} from './errors/addresses.errors';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ROW = {
  id: 'addr-1',
  userId: 'u1',
  address: 'пр. Путина, 12',
  locality: 'Грозный',
  details: null,
  latitude: 43.3169,
  longitude: 45.6981,
  isDefault: true,
  createdAt: new Date('2026-08-22T10:00:00Z'),
};

const makeService = (
  over: {
    count?: number;
    created?: unknown;
    updatedCount?: number;
    deletedCount?: number;
    findFirst?: unknown;
  } = {},
) => {
  const count = jest.fn().mockResolvedValue(over.count ?? 0);
  const create = jest
    .fn<Promise<unknown>, [Prisma.UserAddressCreateArgs]>()
    .mockResolvedValue(over.created ?? ROW);
  const updateMany = jest
    .fn<Promise<{ count: number }>, [Prisma.UserAddressUpdateManyArgs]>()
    .mockResolvedValue({ count: over.updatedCount ?? 1 });
  const update = jest.fn().mockResolvedValue(ROW);
  const deleteMany = jest
    .fn()
    .mockResolvedValue({ count: over.deletedCount ?? 1 });
  const findMany = jest
    .fn<Promise<unknown>, [Prisma.UserAddressFindManyArgs]>()
    .mockResolvedValue([ROW]);
  const findFirst = jest
    .fn()
    .mockResolvedValue(over.findFirst === undefined ? ROW : over.findFirst);

  const prisma = {
    client: {
      userAddress: {
        count,
        create,
        update,
        updateMany,
        deleteMany,
        findMany,
        findFirst,
      },
    },
    runInTransaction: <T>(fn: () => Promise<T>) => fn(),
  } as unknown as PrismaService;

  return {
    service: new AddressesService(prisma),
    count,
    create,
    update,
    updateMany,
    deleteMany,
    findMany,
    findFirst,
  };
};

describe('AddressesService', () => {
  describe('findMine', () => {
    it('основной первым, дальше свежие сверху', async () => {
      const { service, findMany } = makeService();

      await service.findMine('u1');

      expect(findMany.mock.calls[0][0]).toMatchObject({
        where: { userId: 'u1' },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('save', () => {
    it('новый адрес сразу становится основным', async () => {
      const { service, create } = makeService();

      await service.save('u1', {
        address: 'Грозный, пр. Путина, 12',
        latitude: 43.3169,
        longitude: 45.6981,
      });

      expect(create.mock.calls[0][0].data).toMatchObject({
        userId: 'u1',
        isDefault: true,
      });
    });

    it('с прежнего основного флаг снимается', async () => {
      const { service, updateMany } = makeService();

      await service.save('u1', {
        address: 'Грозный, пр. Путина, 12',
        latitude: 43.3169,
        longitude: 45.6981,
      });

      expect(updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', isDefault: true },
        data: { isDefault: false },
      });
    });

    it('населённый пункт сохраняется — по нему шапка каталога знает, где мы', async () => {
      const { service, create } = makeService();

      await service.save('u1', {
        address: 'ул. Ленина, 5',
        locality: 'Гикало',
        latitude: 43.2,
        longitude: 45.6,
      });

      expect(create.mock.calls[0][0].data).toMatchObject({
        address: 'ул. Ленина, 5',
        locality: 'Гикало',
      });
    });

    it('пункт не прислали → null, а не подстановка города пилота', async () => {
      const { service, create } = makeService();

      await service.save('u1', {
        address: 'ул. Ленина, 5',
        latitude: 43.2,
        longitude: 45.6,
      });

      expect(create.mock.calls[0][0].data).toMatchObject({ locality: null });
    });

    it('книга заполнена → конфликт, а не молчаливое сохранение', async () => {
      const { service, create } = makeService({ count: MAX_SAVED_ADDRESSES });

      await expect(
        service.save('u1', {
          address: 'Грозный, пр. Путина, 12',
          latitude: 43.3169,
          longitude: 45.6981,
        }),
      ).rejects.toBeInstanceOf(AddressLimitReachedError);

      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('makeDefault', () => {
    it('чужой адрес не найдётся — и флаг у своих не снимется', async () => {
      const { service, updateMany } = makeService({ updatedCount: 0 });

      await expect(service.makeDefault('u1', 'addr-9')).rejects.toBeInstanceOf(
        AddressNotFoundError,
      );

      expect(updateMany).toHaveBeenCalledTimes(1);
    });

    it('свой адрес помечается по паре id + userId', async () => {
      const { service, updateMany } = makeService();

      await service.makeDefault('u1', 'addr-1');

      expect(updateMany.mock.calls[0][0].where).toEqual({
        id: 'addr-1',
        userId: 'u1',
      });
    });
  });

  describe('remove', () => {
    it('удаляет только свой адрес', async () => {
      const { service, deleteMany } = makeService();

      await service.remove('u1', 'addr-1');

      expect(deleteMany).toHaveBeenCalledWith({
        where: { id: 'addr-1', userId: 'u1' },
      });
    });

    it('нечего удалять → 404, а не тихий успех', async () => {
      const { service } = makeService({ deletedCount: 0 });

      await expect(service.remove('u1', 'addr-9')).rejects.toBeInstanceOf(
        AddressNotFoundError,
      );
    });

    it('убрали основной → основным становится самый свежий из оставшихся', async () => {
      const { service, findFirst, update } = makeService();
      findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'addr-2' });

      await service.remove('u1', 'addr-1');

      expect(update).toHaveBeenCalledWith({
        where: { id: 'addr-2' },
        data: { isDefault: true },
      });
    });

    it('удалили последний → назначать нечего, и это не ошибка', async () => {
      const { service, findFirst, update } = makeService();
      findFirst.mockResolvedValue(null);

      await expect(service.remove('u1', 'addr-1')).resolves.toBeUndefined();

      expect(update).not.toHaveBeenCalled();
    });
  });
});
