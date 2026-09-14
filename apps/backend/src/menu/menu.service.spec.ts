import { Prisma } from '@prisma/client';
import { MenuService } from './menu.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../redis/cache.service';
import { CacheKeys } from '../redis/cache-keys';
import { RestaurantNotFoundError } from '../restaurants/domain/errors/restaurants.errors';
import { MenuItemNotFoundError } from './errors/menu.errors';

const money = (n: number) => new Prisma.Decimal(n);

const item = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'i1',
  name: 'Пицца Маргарита',
  description: null,
  composition: 'Томатный соус, моцарелла',
  itemType: 'DISH',
  weight: '480 г',
  volume: null,
  calories: 1100,
  price: money(590),
  discountPrice: null,
  discountUntil: null,
  photos: ['https://cdn/1.jpg', 'https://cdn/2.jpg'],
  isAvailable: true,
  modifierGroups: [],
  ...over,
});

const makeService = (overrides: {
  restaurant?: unknown;
  categories?: unknown[];
  menuItem?: unknown;
}) => {
  const restaurantFindFirst = jest
    .fn()
    .mockResolvedValue(overrides.restaurant ?? null);
  const categoryFindMany = jest
    .fn()
    .mockResolvedValue(overrides.categories ?? []);
  const itemFindFirst = jest.fn().mockResolvedValue(overrides.menuItem ?? null);
  const prisma = {
    client: {
      restaurant: { findFirst: restaurantFindFirst },
      menuCategory: { findMany: categoryFindMany },
      menuItem: { findFirst: itemFindFirst },
    },
  } as unknown as PrismaService;

  const wrap = jest.fn(
    (_key: string, _ttl: number, loader: () => Promise<unknown>) => loader(),
  );
  const cache = { wrap } as unknown as CacheService;

  return {
    service: new MenuService(prisma, cache),
    restaurantFindFirst,
    categoryFindMany,
    itemFindFirst,
    wrap,
  };
};

describe('MenuService', () => {
  describe('findBrandMenu', () => {
    it('бренда нет / выключен / скрыт → RESTAURANT_NOT_FOUND', async () => {
      const { service, restaurantFindFirst } = makeService({
        restaurant: null,
      });

      await expect(service.findBrandMenu('нет-такого')).rejects.toBeInstanceOf(
        RestaurantNotFoundError,
      );
      expect(restaurantFindFirst).toHaveBeenCalledWith({
        where: {
          slug: 'нет-такого',
          isActive: true,
          showInCatalog: true,
          branches: { some: { isActive: true } },
        },
        select: { id: true },
      });
    });

    it('читает только активные разделы бренда, в порядке ресторана', async () => {
      const { service, categoryFindMany } = makeService({
        restaurant: { id: 'r1' },
      });
      await service.findBrandMenu('vasabi');

      const args = (
        categoryFindMany.mock.calls as Prisma.MenuCategoryFindManyArgs[][]
      )[0][0];
      expect(args.where).toEqual({ restaurantId: 'r1', isActive: true });
      expect(args.orderBy).toEqual([{ sortOrder: 'asc' }, { name: 'asc' }]);
    });

    it('пустые разделы не отдаём (заголовок без содержимого)', async () => {
      const { service } = makeService({
        restaurant: { id: 'r1' },
        categories: [
          { id: 'c1', name: 'Пицца', items: [item()] },
          { id: 'c2', name: 'Скоро будет', items: [] },
        ],
      });

      const menu = await service.findBrandMenu('vasabi');
      expect(menu.map((c) => c.name)).toEqual(['Пицца']);
    });

    it('маппит позицию: Decimal → number, первое фото, флаги модификаторов', async () => {
      const { service } = makeService({
        restaurant: { id: 'r1' },
        categories: [
          {
            id: 'c1',
            name: 'Пицца',
            items: [
              item({
                modifierGroups: [{ isRequired: true }, { isRequired: false }],
              }),
            ],
          },
        ],
      });

      const [category] = await service.findBrandMenu('vasabi');
      expect(category.items[0]).toEqual({
        id: 'i1',
        name: 'Пицца Маргарита',
        description: null,
        composition: 'Томатный соус, моцарелла',
        itemType: 'DISH',
        weight: '480 г',
        volume: null,
        calories: 1100,
        price: 590,
        oldPrice: null,
        photoUrl: 'https://cdn/1.jpg',
        isAvailable: true,
        hasModifiers: true,
        hasRequiredModifiers: true,
      });
    });

    it('нет обязательных групп → hasRequiredModifiers=false («+» кладёт сразу)', async () => {
      const { service } = makeService({
        restaurant: { id: 'r1' },
        categories: [
          {
            id: 'c1',
            name: 'Пицца',
            items: [item({ modifierGroups: [{ isRequired: false }] })],
          },
        ],
      });

      const [category] = await service.findBrandMenu('vasabi');
      expect(category.items[0]).toMatchObject({
        hasModifiers: true,
        hasRequiredModifiers: false,
      });
    });

    it('позиция из стоп-листа показывается с isAvailable=false, а не пропадает', async () => {
      const { service } = makeService({
        restaurant: { id: 'r1' },
        categories: [
          {
            id: 'c1',
            name: 'Напитки',
            items: [item({ id: 'cola', isAvailable: false })],
          },
        ],
      });

      const [category] = await service.findBrandMenu('vasabi');
      expect(category.items).toHaveLength(1);
      expect(category.items[0].isAvailable).toBe(false);
    });

    it('скидка отдаётся уже применённой (price/oldPrice)', async () => {
      const { service } = makeService({
        restaurant: { id: 'r1' },
        categories: [
          {
            id: 'c1',
            name: 'Роллы',
            items: [item({ price: money(540), discountPrice: money(449) })],
          },
        ],
      });

      const [category] = await service.findBrandMenu('vasabi');
      expect(category.items[0]).toMatchObject({ price: 449, oldPrice: 540 });
    });

    it('меню кешируется по slug', async () => {
      const { service, wrap } = makeService({ restaurant: { id: 'r1' } });
      await service.findBrandMenu('vasabi');
      expect(wrap.mock.calls[0][0]).toBe(CacheKeys.brandMenu('vasabi'));
    });

    it('нет фото → photoUrl = null', async () => {
      const { service } = makeService({
        restaurant: { id: 'r1' },
        categories: [
          { id: 'c1', name: 'Пицца', items: [item({ photos: [] })] },
        ],
      });

      const [category] = await service.findBrandMenu('vasabi');
      expect(category.items[0].photoUrl).toBeNull();
    });
  });

  describe('findMenuItem', () => {
    it('не нашёл → MENU_ITEM_NOT_FOUND', async () => {
      const { service } = makeService({ menuItem: null });
      await expect(service.findMenuItem('i1')).rejects.toBeInstanceOf(
        MenuItemNotFoundError,
      );
    });

    it('по прямой ссылке не отдаёт блюдо скрытого раздела или выключенного бренда', async () => {
      const { service, itemFindFirst } = makeService({ menuItem: null });
      await expect(service.findMenuItem('i1')).rejects.toBeInstanceOf(
        MenuItemNotFoundError,
      );

      const args = (
        itemFindFirst.mock.calls as Prisma.MenuItemFindFirstArgs[][]
      )[0][0];
      expect(args.where).toEqual({
        id: 'i1',
        category: { isActive: true },
        restaurant: {
          isActive: true,
          showInCatalog: true,
          branches: { some: { isActive: true } },
        },
      });
    });

    it('собирает блюдо с группами и опциями', async () => {
      const { service } = makeService({
        menuItem: item({
          modifierGroups: [
            {
              id: 'g1',
              name: 'Размер',
              type: 'SINGLE',
              isRequired: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                {
                  id: 'o1',
                  name: '25 см',
                  priceDelta: money(0),
                  isAvailable: true,
                },
                {
                  id: 'o2',
                  name: '30 см',
                  priceDelta: money(150),
                  isAvailable: false,
                },
              ],
            },
          ],
        }),
      });

      const dish = await service.findMenuItem('i1');
      expect(dish).toMatchObject({
        id: 'i1',
        photos: ['https://cdn/1.jpg', 'https://cdn/2.jpg'],
        hasRequiredModifiers: true,
        modifierGroups: [
          {
            id: 'g1',
            name: 'Размер',
            type: 'SINGLE',
            isRequired: true,
            minSelections: 1,
            maxSelections: 1,
            options: [
              { id: 'o1', name: '25 см', priceDelta: 0, isAvailable: true },
              { id: 'o2', name: '30 см', priceDelta: 150, isAvailable: false },
            ],
          },
        ],
      });
    });

    it('блюдо кешируется по id, а «не найдено» — нет', async () => {
      const { service, wrap } = makeService({ menuItem: null });
      await expect(service.findMenuItem('i1')).rejects.toBeInstanceOf(
        MenuItemNotFoundError,
      );

      expect(wrap.mock.calls[0][0]).toBe(CacheKeys.menuItem('i1'));
      await expect(wrap.mock.calls[0][2]()).resolves.toBeNull();
    });

    it('отрицательная доплата («без соуса») сохраняет знак', async () => {
      const { service } = makeService({
        menuItem: item({
          modifierGroups: [
            {
              id: 'g1',
              name: 'Добавки',
              type: 'MULTIPLE',
              isRequired: false,
              minSelections: 0,
              maxSelections: null,
              options: [
                {
                  id: 'o1',
                  name: 'Без соуса',
                  priceDelta: money(-20),
                  isAvailable: true,
                },
              ],
            },
          ],
        }),
      });

      const dish = await service.findMenuItem('i1');
      expect(dish.modifierGroups[0].options[0].priceDelta).toBe(-20);
      expect(dish.modifierGroups[0].maxSelections).toBeNull();
    });
  });
});
