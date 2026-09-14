import { CatalogSort } from '@foodhubme/shared';
import type { Prisma } from '@prisma/client';
import { RestaurantsQueryRepository } from './restaurants.query-repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../redis/cache.service';
import { CacheKeys } from '../../redis/cache-keys';

const decimal = (n: number) => ({ toNumber: () => n }) as never;

const alwaysOpen = {
  mon: [{ from: '00:00', to: '23:59' }],
  tue: [{ from: '00:00', to: '23:59' }],
  wed: [{ from: '00:00', to: '23:59' }],
  thu: [{ from: '00:00', to: '23:59' }],
  fri: [{ from: '00:00', to: '23:59' }],
  sat: [{ from: '00:00', to: '23:59' }],
  sun: [{ from: '00:00', to: '23:59' }],
};

const brand = {
  id: 'r1',
  name: 'Васаби',
  slug: 'vasabi',
  description: 'Суши',
  logoUrl: null,
  cuisineTypes: ['суши', 'роллы'],
  ratingFood: decimal(4.7),
  ratingDelivery: decimal(4.5),
  reviewsCount: 12,
};

const branchRow = {
  id: 'b1',
  name: null,
  address: 'пр. Мохаммеда Али, 5',
  phone: '+7 928 000-00-00',
  latitude: 43.3178,
  longitude: 45.6949,
  workingHours: alwaysOpen,
  acceptingOrders: true,
  hasDelivery: true,
  hasPickup: true,
  hasDineIn: true,
  minOrderAmount: decimal(500),
  deliveryBaseFee: decimal(120),
  freeDeliveryMinOrder: decimal(1500),
  city: { name: 'Грозный' },
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

const firstCallArgs = (mock: jest.Mock): Prisma.RestaurantFindManyArgs =>
  (mock.mock.calls as Prisma.RestaurantFindManyArgs[][])[0][0];

const makeCache = () => {
  const wrap = jest.fn(
    (_key: string, _ttl: number, loader: () => Promise<unknown>) => loader(),
  );
  return { cache: { wrap } as unknown as CacheService, wrap };
};

const makeRepo = (rows: unknown[], first: unknown = null) => {
  const findMany = jest.fn().mockResolvedValue(rows);
  const findFirst = jest.fn().mockResolvedValue(first);
  const prisma = {
    client: { restaurant: { findMany, findFirst } },
  } as unknown as PrismaService;
  const { cache, wrap } = makeCache();
  return {
    repo: new RestaurantsQueryRepository(prisma, cache),
    findMany,
    findFirst,
    wrap,
  };
};

describe('RestaurantsQueryRepository', () => {
  describe('findCatalog', () => {
    it('читает только активные видимые бренды с активной точкой, по алфавиту', async () => {
      const { repo, findMany } = makeRepo([]);
      await repo.findCatalog();

      expect(findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          showInCatalog: true,
          branches: { some: { isActive: true } },
        },
        orderBy: [{ name: 'asc' }],
        include: {
          branches: {
            where: { isActive: true },
            select: {
              workingHours: true,
              hasDelivery: true,
              deliveryBaseFee: true,
              freeDeliveryMinOrder: true,
            },
          },
        },
      });
    });

    it('маппит в контракт: Decimal-рейтинги → number, isOpen считается по графику', async () => {
      const { repo } = makeRepo([
        { ...brand, branches: [catalogBranch(alwaysOpen)] },
      ]);
      const result = await repo.findCatalog();

      expect(result).toEqual([
        {
          id: 'r1',
          name: 'Васаби',
          slug: 'vasabi',
          description: 'Суши',
          logoUrl: null,
          cuisineTypes: ['суши', 'роллы'],
          ratingFood: 4.7,
          ratingDelivery: 4.5,
          reviewsCount: 12,
          isOpen: true,
          deliveryFeeFrom: 149,
          freeDeliveryFrom: 1500,
        },
      ]);
      expect(typeof result[0].ratingFood).toBe('number');
    });

    it('бренд закрыт, если закрыты ВСЕ его точки', async () => {
      const closed = { mon: [], tue: [] };
      const { repo } = makeRepo([
        {
          ...brand,
          branches: [catalogBranch(closed), catalogBranch(closed)],
        },
      ]);
      await expect(repo.findCatalog()).resolves.toMatchObject([
        { isOpen: false },
      ]);
    });

    it('бренд открыт, если открыта ХОТЯ БЫ ОДНА точка', async () => {
      const { repo } = makeRepo([
        {
          ...brand,
          branches: [catalogBranch({}), catalogBranch(alwaysOpen)],
        },
      ]);
      await expect(repo.findCatalog()).resolves.toMatchObject([
        { isOpen: true },
      ]);
    });

    it.each([
      [CatalogSort.RATING, [{ ratingFood: 'desc' }, { name: 'asc' }]],
      [CatalogSort.REVIEWS, [{ reviewsCount: 'desc' }, { name: 'asc' }]],
      [CatalogSort.DELIVERY, [{ ratingDelivery: 'desc' }, { name: 'asc' }]],
      [CatalogSort.NAME, [{ name: 'asc' }]],
    ])('сортировка %s', async (sort, expected) => {
      const { repo, findMany } = makeRepo([]);
      await repo.findCatalog({ sort });
      expect(firstCallArgs(findMany).orderBy).toEqual(expected);
    });

    it('фильтр по кухне уходит в SQL (has по массиву)', async () => {
      const { repo, findMany } = makeRepo([]);
      await repo.findCatalog({ cuisine: 'Суши' });
      expect(firstCallArgs(findMany).where?.cuisineTypes).toEqual({
        has: 'Суши',
      });
    });

    it('фильтр по городу сужает ТОЧКИ, а не бренд', async () => {
      const { repo, findMany } = makeRepo([]);
      await repo.findCatalog({ city: 'grozny' });
      const args = firstCallArgs(findMany);
      expect(args.where?.branches).toEqual({
        some: { isActive: true, city: { slug: 'grozny' } },
      });
      expect(args.include?.branches).toMatchObject({
        where: {
          isActive: true,
          city: { slug: 'grozny' },
        },
      });
    });

    it('open=true отсеивает закрытые уже после выборки', async () => {
      const { repo } = makeRepo([
        { ...brand, id: 'open', branches: [catalogBranch(alwaysOpen)] },
        { ...brand, id: 'closed', branches: [catalogBranch({})] },
      ]);
      const result = await repo.findCatalog({ open: true });
      expect(result.map((r) => r.id)).toEqual(['open']);
    });

    it('open=false ничего не отсеивает', async () => {
      const { repo } = makeRepo([
        { ...brand, id: 'open', branches: [catalogBranch(alwaysOpen)] },
        { ...brand, id: 'closed', branches: [catalogBranch({})] },
      ]);
      await expect(repo.findCatalog({ open: false })).resolves.toHaveLength(2);
    });

    it('пустой каталог → пустой массив', async () => {
      const { repo } = makeRepo([]);
      await expect(repo.findCatalog()).resolves.toEqual([]);
    });

    it('запрос БЕЗ фильтров идёт через кеш', async () => {
      const { repo, wrap } = makeRepo([]);
      await repo.findCatalog();
      expect(wrap.mock.calls[0][0]).toBe(CacheKeys.catalog());
    });

    it.each([
      ['cuisine', { cuisine: 'Суши' }],
      ['city', { city: 'grozny' }],
      ['open=true', { open: true }],
      ['open=false', { open: false }],
    ])('запрос с фильтром (%s) кеш НЕ трогает', async (_case, filters) => {
      const { repo, wrap } = makeRepo([]);
      await repo.findCatalog(filters);
      expect(wrap).not.toHaveBeenCalled();
    });
  });

  describe('findDetailsBySlug', () => {
    it('ищет активный видимый бренд, у которого ЕСТЬ активная точка', async () => {
      const { repo, findFirst } = makeRepo([], null);
      await repo.findDetailsBySlug('vasabi');

      expect(findFirst).toHaveBeenCalledWith({
        where: {
          slug: 'vasabi',
          isActive: true,
          showInCatalog: true,
          branches: { some: { isActive: true } },
        },
        include: {
          branches: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            include: { city: { select: { name: true } } },
          },
        },
      });
    });

    it('кешируется по slug', async () => {
      const { repo, wrap } = makeRepo([], null);
      await repo.findDetailsBySlug('vasabi');
      expect(wrap.mock.calls[0][0]).toBe(CacheKeys.restaurant('vasabi'));
    });

    it('не нашёл — null (в ошибку это превращает хендлер)', async () => {
      const { repo } = makeRepo([], null);
      await expect(repo.findDetailsBySlug('нет-такого')).resolves.toBeNull();
    });

    it('собирает бренд с точками; параметры расчёта доставки наружу не уходят', async () => {
      const { repo } = makeRepo([], { ...brand, branches: [branchRow] });
      const result = await repo.findDetailsBySlug('vasabi');

      expect(result).toMatchObject({
        slug: 'vasabi',
        isOpen: true,
        branches: [
          {
            id: 'b1',
            name: null,
            address: 'пр. Мохаммеда Али, 5',
            cityName: 'Грозный',
            isOpen: true,
            closesAt: '23:59',
            minOrderAmount: 500,
            deliveryBaseFee: 120,
            freeDeliveryMinOrder: 1500,
          },
        ],
      });
      expect(result!.branches[0]).not.toHaveProperty('deliveryPerKm');
      expect(result!.branches[0]).not.toHaveProperty('deliveryMaxRadiusKm');
    });

    it('freeDeliveryMinOrder = null, когда акции нет', async () => {
      const { repo } = makeRepo([], {
        ...brand,
        branches: [{ ...branchRow, freeDeliveryMinOrder: null }],
      });
      const result = await repo.findDetailsBySlug('vasabi');
      expect(result!.branches[0].freeDeliveryMinOrder).toBeNull();
    });
  });
});
