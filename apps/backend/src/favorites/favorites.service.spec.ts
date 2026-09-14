import { Prisma } from '@prisma/client';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantNotFoundError } from '../restaurants/domain/errors/restaurants.errors';

const decimal = (n: number) => new Prisma.Decimal(n);

const around = { from: '00:00', to: '23:59' };
const alwaysOpen = {
  mon: [around],
  tue: [around],
  wed: [around],
  thu: [around],
  fri: [around],
  sat: [around],
  sun: [around],
};

const catalogBranch = (
  workingHours: unknown,
  over: Record<string, unknown> = {},
) => ({
  workingHours,
  hasDelivery: true,
  deliveryBaseFee: decimal(149),
  freeDeliveryMinOrder: decimal(1500),
  ...over,
});

const brand = {
  id: 'r1',
  name: 'Васаби',
  slug: 'vasabi',
  description: 'Суши',
  logoUrl: null,
  cuisineTypes: ['суши'],
  ratingFood: decimal(4.4),
  ratingDelivery: decimal(4.3),
  reviewsCount: 128,
  branches: [catalogBranch(alwaysOpen)],
};

const makeService = (
  over: { restaurant?: unknown; favorites?: unknown[] } = {},
) => {
  const restaurantFindFirst = jest
    .fn()
    .mockResolvedValue(over.restaurant ?? null);
  const favoriteFindMany = jest.fn().mockResolvedValue(over.favorites ?? []);
  const upsert = jest.fn().mockResolvedValue({});
  const deleteMany = jest.fn().mockResolvedValue({ count: 0 });

  const prisma = {
    client: {
      restaurant: { findFirst: restaurantFindFirst },
      userFavorite: { findMany: favoriteFindMany, upsert, deleteMany },
    },
  } as unknown as PrismaService;

  return {
    service: new FavoritesService(prisma),
    restaurantFindFirst,
    favoriteFindMany,
    upsert,
    deleteMany,
  };
};

describe('FavoritesService', () => {
  describe('findMine', () => {
    it('читает ТОЛЬКО своё и только живые бренды, свежие сверху', async () => {
      const { service, favoriteFindMany } = makeService();
      await service.findMine('u1');

      const args = (
        favoriteFindMany.mock.calls as Prisma.UserFavoriteFindManyArgs[][]
      )[0][0];
      expect(args.where).toEqual({
        userId: 'u1',
        restaurant: { isActive: true, showInCatalog: true },
      });
      expect(args.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('отдаёт карточку того же вида, что каталог, с посчитанным isOpen', async () => {
      const { service } = makeService({ favorites: [{ restaurant: brand }] });

      await expect(service.findMine('u1')).resolves.toEqual([
        {
          id: 'r1',
          name: 'Васаби',
          slug: 'vasabi',
          description: 'Суши',
          logoUrl: null,
          cuisineTypes: ['суши'],
          ratingFood: 4.4,
          ratingDelivery: 4.3,
          reviewsCount: 128,
          isOpen: true,
          deliveryFeeFrom: 149,
          freeDeliveryFrom: 1500,
        },
      ]);
    });

    it('бренд с закрытыми точками — isOpen=false, но из списка не пропадает', async () => {
      const { service } = makeService({
        favorites: [
          { restaurant: { ...brand, branches: [catalogBranch({})] } },
        ],
      });

      await expect(service.findMine('u1')).resolves.toMatchObject([
        { isOpen: false },
      ]);
    });

    it('пусто → пустой массив', async () => {
      const { service } = makeService();
      await expect(service.findMine('u1')).resolves.toEqual([]);
    });
  });

  describe('add', () => {
    it('несуществующий/скрытый бренд → RESTAURANT_NOT_FOUND, записи нет', async () => {
      const { service, upsert, restaurantFindFirst } = makeService({
        restaurant: null,
      });

      await expect(service.add('u1', 'r-нет')).rejects.toBeInstanceOf(
        RestaurantNotFoundError,
      );
      expect(restaurantFindFirst).toHaveBeenCalledWith({
        where: { id: 'r-нет', isActive: true, showInCatalog: true },
        select: { id: true },
      });
      expect(upsert).not.toHaveBeenCalled();
    });

    it('добавляет через upsert по паре (user, restaurant) — двойной тап не падает', async () => {
      const { service, upsert } = makeService({ restaurant: { id: 'r1' } });
      await service.add('u1', 'r1');

      expect(upsert).toHaveBeenCalledWith({
        where: { userId_restaurantId: { userId: 'u1', restaurantId: 'r1' } },
        update: {},
        create: { userId: 'u1', restaurantId: 'r1' },
      });
    });
  });

  describe('remove', () => {
    it('удаляет только СВОЮ строку', async () => {
      const { service, deleteMany } = makeService();
      await service.remove('u1', 'r1');

      expect(deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', restaurantId: 'r1' },
      });
    });

    it('удаление того, чего нет, не бросает', async () => {
      const { service } = makeService();
      await expect(service.remove('u1', 'r-нет')).resolves.toBeUndefined();
    });
  });
});
