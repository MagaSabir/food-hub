import { Prisma } from '@prisma/client';
import type { Prisma as PrismaTypes } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchPolicy } from './search.policy';
import { SearchService } from './search.service';

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

const brand = {
  id: 'r1',
  name: 'Васаби',
  slug: 'vasabi',
  description: 'Суши',
  logoUrl: null,
  photos: [],
  cuisineTypes: ['суши'],
  ratingFood: decimal(4.4),
  ratingDelivery: decimal(4.3),
  reviewsCount: 12,
  branches: [
    {
      workingHours: alwaysOpen,
      hasDelivery: true,
      deliveryBaseFee: decimal(149),
      freeDeliveryMinOrder: decimal(1500),
    },
  ],
};

const dish = {
  id: 'd1',
  name: 'Шаурма классическая',
  description: null,
  composition: null,
  itemType: 'DISH',
  weight: '350 г',
  volume: null,
  calories: null,
  price: decimal(290),
  discountPrice: null,
  discountUntil: null,
  photos: ['https://cdn/1.jpg'],
  isAvailable: true,
  modifierGroups: [{ isRequired: true }],
  restaurant: { id: 'r2', name: 'Шаурма №1', slug: 'shaurma-1', logoUrl: null },
};

const makeService = (over: { brands?: unknown[]; dishes?: unknown[] } = {}) => {
  const restaurantFindMany = jest.fn().mockResolvedValue(over.brands ?? []);
  const menuItemFindMany = jest.fn().mockResolvedValue(over.dishes ?? []);

  const prisma = {
    client: {
      restaurant: { findMany: restaurantFindMany },
      menuItem: { findMany: menuItemFindMany },
    },
  } as unknown as PrismaService;

  return {
    service: new SearchService(prisma),
    restaurantFindMany,
    menuItemFindMany,
  };
};

type FindManyArgs = {
  where: Record<string, unknown>;
  orderBy?: unknown;
  take?: number;
};

const argsOf = (mock: jest.Mock): FindManyArgs => {
  const [args] = mock.mock.calls[0] as [FindManyArgs];
  return args;
};

const whereOf = (mock: jest.Mock): Record<string, any> => argsOf(mock).where;

describe('SearchService', () => {
  describe('ответ', () => {
    it('две группы всегда, даже пустые', async () => {
      const { service } = makeService();

      await expect(service.search('неттакого')).resolves.toEqual({
        restaurants: [],
        dishes: [],
      });
    });

    it('находит и заведения, и блюда одним запросом', async () => {
      const { service } = makeService({ brands: [brand], dishes: [dish] });

      const results = await service.search('шаурма');

      expect(results.restaurants).toHaveLength(1);
      expect(results.dishes).toHaveLength(1);
    });

    it('у найденного блюда есть его бренд — иначе некуда вести', async () => {
      const { service } = makeService({ dishes: [dish] });

      const [found] = (await service.search('шаурма')).dishes;

      expect(found.restaurant).toEqual({
        id: 'r2',
        name: 'Шаурма №1',
        slug: 'shaurma-1',
        logoUrl: null,
      });
      expect(found).toMatchObject({
        name: 'Шаурма классическая',
        price: 290,
        oldPrice: null,
        photoUrl: 'https://cdn/1.jpg',
        hasRequiredModifiers: true,
      });
    });

    it('карточка заведения — та же, что в каталоге', async () => {
      const { service } = makeService({ brands: [brand] });

      const [card] = (await service.search('васаби')).restaurants;

      expect(card).toMatchObject({
        id: 'r1',
        slug: 'vasabi',
        isOpen: true,
        deliveryFeeFrom: 149,
        freeDeliveryFrom: 1500,
      });
    });
  });

  describe('заведения', () => {
    it('по названию — вхождением, без учёта регистра', async () => {
      const { service, restaurantFindMany } = makeService();

      await service.search('САБИ');

      expect(whereOf(restaurantFindMany).OR).toContainEqual({
        name: { contains: 'САБИ', mode: 'insensitive' },
      });
    });

    it('по кухне — целым словом, в любом написании', async () => {
      const { service, restaurantFindMany } = makeService();

      await service.search('суши');

      expect(whereOf(restaurantFindMany).OR).toContainEqual({
        cuisineTypes: { hasSome: ['суши', 'Суши'] },
      });
    });

    it('только те, что вообще можно показать клиенту', async () => {
      const { service, restaurantFindMany } = makeService();

      await service.search('шаурма');

      expect(whereOf(restaurantFindMany)).toMatchObject({
        isActive: true,
        showInCatalog: true,
        branches: { some: { isActive: true } },
      });
    });
  });

  describe('блюда', () => {
    it('ищем по имени, но НЕ по составу и описанию', async () => {
      const { service, menuItemFindMany } = makeService();

      await service.search('шаурма');

      const where = whereOf(menuItemFindMany);
      expect(where.name).toEqual({ contains: 'шаурма', mode: 'insensitive' });
      expect(where.description).toBeUndefined();
      expect(where.composition).toBeUndefined();
    });

    it('только из живых брендов и включённых разделов', async () => {
      const { service, menuItemFindMany } = makeService();

      await service.search('шаурма');

      expect(whereOf(menuItemFindMany)).toMatchObject({
        restaurant: { isActive: true, showInCatalog: true },
        category: { isActive: true },
      });
    });

    it('стоп-лист НЕ прячем — гасим карточку', async () => {
      const { service, menuItemFindMany } = makeService({
        dishes: [{ ...dish, isAvailable: false }],
      });

      const [found] = (await service.search('шаурма')).dishes;

      expect(whereOf(menuItemFindMany).isAvailable).toBeUndefined();
      expect(found.isAvailable).toBe(false);
    });

    it('доступные показываем выше', async () => {
      const { service, menuItemFindMany } = makeService();

      await service.search('шаурма');

      expect(argsOf(menuItemFindMany).orderBy).toEqual([
        { isAvailable: 'desc' },
        { name: 'asc' },
      ]);
    });
  });

  describe('объём выдачи', () => {
    it('ограничен потолком с обеих сторон', async () => {
      const { service, restaurantFindMany, menuItemFindMany } = makeService();

      await service.search('а-а');

      expect(argsOf(restaurantFindMany).take).toBe(
        SearchPolicy.MAX_RESTAURANTS,
      );
      expect(argsOf(menuItemFindMany).take).toBe(SearchPolicy.MAX_DISHES);
    });
  });

  it('пробелы по краям запроса не ищутся', async () => {
    const { service, menuItemFindMany } = makeService();

    await service.search('  шаурма  ');

    const name = whereOf(menuItemFindMany).name as PrismaTypes.StringFilter;
    expect(name.contains).toBe('шаурма');
  });
});
