import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ErrorCodes } from '@foodhubme/shared';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../redis/cache.service';
import { CacheKeys } from '../redis/cache-keys';
import { applyAppInitialization } from '../setup/app-initialization';

describe('Каталог и меню (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let cache: CacheService;

  const SUFFIX = Math.random().toString(36).slice(2, 8);
  const CITY = `e2e-city-${SUFFIX}`;
  const OPEN_BRAND = `e2e-open-${SUFFIX}`;
  const NO_BRANCH_BRAND = `e2e-no-branch-${SUFFIX}`;
  const HIDDEN_BRAND = `e2e-hidden-${SUFFIX}`;
  const CUISINE = `e2e-кухня-${SUFFIX}`;

  const ids = {
    city: '',
    openBrand: '',
    noBranchBrand: '',
    hiddenBrand: '',
    pizzaCategory: '',
    emptyCategory: '',
    margarita: '',
    cola: '',
    expiredDiscount: '',
    hiddenBrandItem: '',
  };

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

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    applyAppInitialization(app);
    await app.init();

    prisma = app.get(PrismaService);
    cache = app.get(CacheService);

    const city = await prisma.client.city.create({
      data: { name: CITY, slug: CITY },
    });
    ids.city = city.id;

    const openBrand = await prisma.client.restaurant.create({
      data: {
        name: `E2E Открытый ${SUFFIX}`,
        slug: OPEN_BRAND,
        cuisineTypes: [CUISINE],
        branches: {
          create: {
            cityId: city.id,
            address: 'ул. Тестовая, 1',
            phone: '+7 928 000-00-00',
            workingHours: alwaysOpen,
            minOrderAmount: 500,
            deliveryBaseFee: 149,
            freeDeliveryMinOrder: 1500,
            latitude: 43.3169,
            longitude: 45.6981,
            deliveryMaxRadiusKm: 5,
          },
        },
      },
    });
    ids.openBrand = openBrand.id;

    const pizza = await prisma.client.menuCategory.create({
      data: { restaurantId: openBrand.id, name: 'Пицца', sortOrder: 0 },
    });
    ids.pizzaCategory = pizza.id;

    const empty = await prisma.client.menuCategory.create({
      data: { restaurantId: openBrand.id, name: 'Скоро будет', sortOrder: 1 },
    });
    ids.emptyCategory = empty.id;

    const margarita = await prisma.client.menuItem.create({
      data: {
        restaurantId: openBrand.id,
        categoryId: pizza.id,
        name: 'Маргарита',
        composition: 'Томатный соус, моцарелла',
        price: 590,
        photos: ['https://cdn/margarita.jpg'],
        sortOrder: 0,
        modifierGroups: {
          create: {
            name: 'Размер',
            type: 'SINGLE',
            isRequired: true,
            minSelections: 1,
            maxSelections: 1,
            options: {
              create: [
                { name: '25 см', priceDelta: 0, sortOrder: 0 },
                { name: '30 см', priceDelta: 150, sortOrder: 1 },
                {
                  name: '35 см',
                  priceDelta: 300,
                  isAvailable: false,
                  sortOrder: 2,
                },
              ],
            },
          },
        },
      },
    });
    ids.margarita = margarita.id;

    const cola = await prisma.client.menuItem.create({
      data: {
        restaurantId: openBrand.id,
        categoryId: pizza.id,
        name: 'Кола',
        itemType: 'DRINK',
        price: 150,
        volume: '0.5 л',
        isAvailable: false,
        sortOrder: 1,
      },
    });
    ids.cola = cola.id;

    const expired = await prisma.client.menuItem.create({
      data: {
        restaurantId: openBrand.id,
        categoryId: pizza.id,
        name: 'Вчерашняя акция',
        price: 540,
        discountPrice: 449,
        discountUntil: new Date(Date.now() - 60_000),
        sortOrder: 2,
      },
    });
    ids.expiredDiscount = expired.id;

    const noBranch = await prisma.client.restaurant.create({
      data: {
        name: `E2E Без точки ${SUFFIX}`,
        slug: NO_BRANCH_BRAND,
        cuisineTypes: [CUISINE],
      },
    });
    ids.noBranchBrand = noBranch.id;

    const hidden = await prisma.client.restaurant.create({
      data: {
        name: `E2E Скрытый ${SUFFIX}`,
        slug: HIDDEN_BRAND,
        cuisineTypes: [CUISINE],
        showInCatalog: false,
        branches: {
          create: {
            cityId: city.id,
            address: 'ул. Тестовая, 2',
            phone: '+7 928 000-00-00',
            workingHours: alwaysOpen,
          },
        },
        menuCategories: { create: { name: 'Секретное' } },
      },
    });
    ids.hiddenBrand = hidden.id;

    const hiddenCategory = await prisma.client.menuCategory.findFirstOrThrow({
      where: { restaurantId: hidden.id },
    });
    const hiddenItem = await prisma.client.menuItem.create({
      data: {
        restaurantId: hidden.id,
        categoryId: hiddenCategory.id,
        name: 'Секретное блюдо',
        price: 100,
      },
    });
    ids.hiddenBrandItem = hiddenItem.id;
  });

  afterAll(async () => {
    const brandIds = [ids.openBrand, ids.noBranchBrand, ids.hiddenBrand].filter(
      Boolean,
    );
    await prisma.client.menuItem.deleteMany({
      where: { restaurantId: { in: brandIds } },
    });
    await prisma.client.menuCategory.deleteMany({
      where: { restaurantId: { in: brandIds } },
    });
    await prisma.client.branch.deleteMany({
      where: { restaurantId: { in: brandIds } },
    });
    await prisma.client.restaurant.deleteMany({
      where: { id: { in: brandIds } },
    });
    if (ids.city)
      await prisma.client.city.deleteMany({ where: { id: ids.city } });
    await app.close();
  });

  describe('GET /restaurants', () => {
    it('гость видит каталог без токена', async () => {
      const res = await api().get('/api/restaurants').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('открытый бренд с точкой есть в каталоге, isOpen=true', async () => {
      const res = await api().get(
        `/api/restaurants?cuisine=${encodeURIComponent(CUISINE)}`,
      );
      const slugs = res.body.map((r: { slug: string }) => r.slug);

      expect(slugs).toContain(OPEN_BRAND);
      const open = res.body.find(
        (r: { slug: string }) => r.slug === OPEN_BRAND,
      );
      expect(open.isOpen).toBe(true);
    });

    it('бренд без активных точек в каталог НЕ попадает', async () => {
      const res = await api().get(
        `/api/restaurants?cuisine=${encodeURIComponent(CUISINE)}`,
      );
      const slugs = res.body.map((r: { slug: string }) => r.slug);

      expect(slugs).not.toContain(NO_BRANCH_BRAND);
    });

    it('скрытый партнёром бренд в каталог НЕ попадает', async () => {
      const res = await api().get(
        `/api/restaurants?cuisine=${encodeURIComponent(CUISINE)}`,
      );
      const slugs = res.body.map((r: { slug: string }) => r.slug);
      expect(slugs).not.toContain(HIDDEN_BRAND);
    });

    it('фильтр по городу отбирает бренды с точкой в нём', async () => {
      const inCity = await api()
        .get(`/api/restaurants?city=${CITY}`)
        .expect(200);
      expect(inCity.body.map((r: { slug: string }) => r.slug)).toEqual([
        OPEN_BRAND,
      ]);

      const elsewhere = await api()
        .get('/api/restaurants?city=no-such-city')
        .expect(200);
      expect(elsewhere.body).toEqual([]);
    });

    it('open=true оставляет открытые, open=false ничего не отсеивает', async () => {
      const onlyOpen = await api()
        .get(
          `/api/restaurants?cuisine=${encodeURIComponent(CUISINE)}&open=true`,
        )
        .expect(200);
      expect(onlyOpen.body.map((r: { slug: string }) => r.slug)).toContain(
        OPEN_BRAND,
      );

      const all = await api()
        .get(
          `/api/restaurants?cuisine=${encodeURIComponent(CUISINE)}&open=false`,
        )
        .expect(200);
      expect(all.body.map((r: { slug: string }) => r.slug)).toContain(
        OPEN_BRAND,
      );
    });

    it('сортировка по рейтингу не ломает выдачу', async () => {
      const res = await api().get('/api/restaurants?sort=rating').expect(200);
      const ratings = res.body.map((r: { ratingFood: number }) => r.ratingFood);
      expect([...ratings].sort((a: number, b: number) => b - a)).toEqual(
        ratings,
      );
    });

    describe('адрес доставки (Шаг 7.0б)', () => {
      const ONLY_OURS = `cuisine=${encodeURIComponent(CUISINE)}`;
      const NEAR = `${ONLY_OURS}&lat=43.3200&lng=45.6981`;
      const FAR = `${ONLY_OURS}&lat=43.4159&lng=45.6981`;

      interface CatalogCard {
        slug: string;
        deliversToAddress: boolean | null;
        distanceKm: number | null;
      }

      const find = (body: CatalogCard[]) =>
        body.find((r) => r.slug === OPEN_BRAND);

      it('без координат поля пустые — вопрос не задавали', async () => {
        const res = await api()
          .get(`/api/restaurants?${ONLY_OURS}`)
          .expect(200);

        expect(find(res.body)).toMatchObject({
          deliversToAddress: null,
          distanceKm: null,
        });
      });

      it('адрес в зоне → возит, и видно расстояние', async () => {
        const res = await api().get(`/api/restaurants?${NEAR}`).expect(200);

        const brand = find(res.body);
        expect(brand?.deliversToAddress).toBe(true);
        expect(brand?.distanceKm).toBeGreaterThan(0);
        expect(brand?.distanceKm).toBeLessThan(5);
      });

      it('адрес вне зоны → бренд ОСТАЁТСЯ в списке с пометкой', async () => {
        const res = await api().get(`/api/restaurants?${FAR}`).expect(200);

        expect(find(res.body)).toMatchObject({ deliversToAddress: false });
      });

      it('одна координата без второй → 400', async () => {
        await api().get('/api/restaurants?lat=43.3200').expect(400);
        await api().get('/api/restaurants?lng=45.6981').expect(400);
      });

      it('координаты за пределами планеты → 400', async () => {
        await api().get('/api/restaurants?lat=100&lng=45.6981').expect(400);
      });
    });

    it('неизвестный sort → 400 VALIDATION_ERROR', async () => {
      const res = await api()
        .get('/api/restaurants?sort=по-настроению')
        .expect(400);
      expect(res.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });
  });

  describe('GET /restaurants/by-slug/:slug', () => {
    it('отдаёт бренд с точкой и витринными параметрами доставки', async () => {
      const res = await api()
        .get(`/api/restaurants/by-slug/${OPEN_BRAND}`)
        .expect(200);

      expect(res.body).toMatchObject({ slug: OPEN_BRAND, isOpen: true });
      expect(res.body.branches).toHaveLength(1);
      expect(res.body.branches[0]).toMatchObject({
        address: 'ул. Тестовая, 1',
        cityName: CITY,
        isOpen: true,
        closesAt: '23:59',
        minOrderAmount: 500,
        deliveryBaseFee: 149,
        freeDeliveryMinOrder: 1500,
      });
      expect(res.body.branches[0]).not.toHaveProperty('deliveryPerKm');
    });

    it('отдаёт НЕДЕЛЬНЫЙ график — из него экран «о заведении»', async () => {
      const res = await api()
        .get(`/api/restaurants/by-slug/${OPEN_BRAND}`)
        .expect(200);

      expect(res.body.branches[0].workingHours).toEqual(alwaysOpen);
    });

    it('кривой график не роняет ответ — сервер отдаёт разобранное', async () => {
      const brand = await prisma.client.restaurant.findUnique({
        where: { slug: OPEN_BRAND },
        select: { branches: { select: { id: true } } },
      });
      const branchId = brand!.branches[0].id;

      await prisma.client.branch.update({
        where: { id: branchId },
        data: {
          workingHours: {
            mon: [{ from: '10:00', to: '22:00' }],
            tue: 'не массив вовсе',
            wed: [{ from: '25:00', to: '99:99' }],
            sat: [{ from: '10:00', to: '10:00' }],
          },
        },
      });

      await cache.invalidate(CacheKeys.restaurant(OPEN_BRAND));

      const res = await api()
        .get(`/api/restaurants/by-slug/${OPEN_BRAND}`)
        .expect(200);

      expect(res.body.branches[0].workingHours).toEqual({
        mon: [{ from: '10:00', to: '22:00' }],
      });

      await prisma.client.branch.update({
        where: { id: branchId },
        data: { workingHours: alwaysOpen },
      });
      await cache.invalidate(CacheKeys.restaurant(OPEN_BRAND));
    });

    it('несуществующий slug → 404 RESTAURANT_NOT_FOUND', async () => {
      const res = await api()
        .get('/api/restaurants/by-slug/net-takogo-brenda')
        .expect(404);
      expect(res.body.code).toBe(ErrorCodes.RESTAURANT_NOT_FOUND);
    });

    it('бренд БЕЗ активных точек по прямой ссылке → 404', async () => {
      const res = await api()
        .get(`/api/restaurants/by-slug/${NO_BRANCH_BRAND}`)
        .expect(404);
      expect(res.body.code).toBe(ErrorCodes.RESTAURANT_NOT_FOUND);
    });

    it('скрытый бренд по прямой ссылке → 404', async () => {
      const res = await api()
        .get(`/api/restaurants/by-slug/${HIDDEN_BRAND}`)
        .expect(404);
      expect(res.body.code).toBe(ErrorCodes.RESTAURANT_NOT_FOUND);
    });
  });

  describe('GET /restaurants/by-slug/:slug/menu', () => {
    it('гость видит меню: разделы по порядку, пустой раздел не приходит', async () => {
      const res = await api()
        .get(`/api/restaurants/by-slug/${OPEN_BRAND}/menu`)
        .expect(200);

      expect(res.body.map((c: { name: string }) => c.name)).toEqual(['Пицца']);
      expect(res.body[0].items.map((i: { name: string }) => i.name)).toEqual([
        'Маргарита',
        'Кола',
        'Вчерашняя акция',
      ]);
    });

    it('стоп-лист приходит с isAvailable=false, а не исчезает', async () => {
      const res = await api()
        .get(`/api/restaurants/by-slug/${OPEN_BRAND}/menu`)
        .expect(200);
      const cola = res.body[0].items.find(
        (i: { id: string }) => i.id === ids.cola,
      );

      expect(cola).toMatchObject({
        isAvailable: false,
        volume: '0.5 л',
        itemType: 'DRINK',
      });
    });

    it('истёкшая скидка не применяется', async () => {
      const res = await api()
        .get(`/api/restaurants/by-slug/${OPEN_BRAND}/menu`)
        .expect(200);
      const item = res.body[0].items.find(
        (i: { id: string }) => i.id === ids.expiredDiscount,
      );

      expect(item).toMatchObject({ price: 540, oldPrice: null });
    });

    it('флаги модификаторов: у Маргариты обязательный размер', async () => {
      const res = await api()
        .get(`/api/restaurants/by-slug/${OPEN_BRAND}/menu`)
        .expect(200);
      const margarita = res.body[0].items.find(
        (i: { id: string }) => i.id === ids.margarita,
      );

      expect(margarita).toMatchObject({
        hasModifiers: true,
        hasRequiredModifiers: true,
        photoUrl: 'https://cdn/margarita.jpg',
      });
      expect(margarita).not.toHaveProperty('modifierGroups');
    });

    it('меню бренда без активных точек → 404', async () => {
      const res = await api()
        .get(`/api/restaurants/by-slug/${NO_BRANCH_BRAND}/menu`)
        .expect(404);
      expect(res.body.code).toBe(ErrorCodes.RESTAURANT_NOT_FOUND);
    });

    it('меню несуществующего бренда → 404 RESTAURANT_NOT_FOUND', async () => {
      const res = await api()
        .get('/api/restaurants/by-slug/net-takogo/menu')
        .expect(404);
      expect(res.body.code).toBe(ErrorCodes.RESTAURANT_NOT_FOUND);
    });
  });

  describe('GET /menu-items/:id', () => {
    it('отдаёт блюдо с группами и опциями по порядку', async () => {
      const res = await api()
        .get(`/api/menu-items/${ids.margarita}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: ids.margarita,
        name: 'Маргарита',
        price: 590,
      });
      expect(res.body.modifierGroups).toHaveLength(1);
      expect(res.body.modifierGroups[0]).toMatchObject({
        name: 'Размер',
        type: 'SINGLE',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
      });
      expect(
        res.body.modifierGroups[0].options.map((o: { name: string }) => o.name),
      ).toEqual(['25 см', '30 см', '35 см']);
      expect(res.body.modifierGroups[0].options[2].isAvailable).toBe(false);
    });

    it('блюдо скрытого бренда по прямой ссылке → 404 MENU_ITEM_NOT_FOUND', async () => {
      const res = await api()
        .get(`/api/menu-items/${ids.hiddenBrandItem}`)
        .expect(404);
      expect(res.body.code).toBe(ErrorCodes.MENU_ITEM_NOT_FOUND);
    });

    it('несуществующий uuid → 404, мусор вместо uuid → 400', async () => {
      const missing = await api()
        .get('/api/menu-items/00000000-0000-4000-8000-000000000000')
        .expect(404);
      expect(missing.body.code).toBe(ErrorCodes.MENU_ITEM_NOT_FOUND);

      await api().get('/api/menu-items/не-uuid').expect(400);
    });
  });
});
