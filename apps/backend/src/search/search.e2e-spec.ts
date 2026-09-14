import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { applyAppInitialization } from '../setup/app-initialization';

describe('Поиск (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const SUFFIX = Math.random().toString(36).slice(2, 8);
  const CITY = `e2e-search-city-${SUFFIX}`;
  const BRAND = `Шаурмятня Квортекс ${SUFFIX}`;
  const HIDDEN_BRAND = `Скрытая Квортекс ${SUFFIX}`;
  const DISH = `Шаурма квортекс ${SUFFIX}`;
  const HIDDEN_DISH = `Шаурма скрытая ${SUFFIX}`;

  const CUISINE = `Квортекс-${SUFFIX}`;

  const ids = { city: '', brand: '', hidden: '' };

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
  const search = (q: string) => api().get('/api/search').query({ q });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    applyAppInitialization(app);
    await app.init();

    prisma = app.get(PrismaService);

    const city = await prisma.client.city.create({
      data: { name: CITY, slug: CITY },
    });
    ids.city = city.id;

    const branch = {
      cityId: city.id,
      address: 'ул. Тестовая, 7',
      phone: '+7 928 000-00-00',
      workingHours: alwaysOpen,
    };

    const brand = await prisma.client.restaurant.create({
      data: {
        name: BRAND,
        slug: `e2e-search-${SUFFIX}`,
        cuisineTypes: [CUISINE],
        branches: { create: branch },
        menuCategories: {
          create: {
            name: 'Основное',
            items: {
              create: {
                name: DISH,
                price: 290,
                photos: [],
              },
            },
          },
        },
      },
    });
    ids.brand = brand.id;

    const hidden = await prisma.client.restaurant.create({
      data: {
        name: HIDDEN_BRAND,
        slug: `e2e-search-hidden-${SUFFIX}`,
        cuisineTypes: [CUISINE],
        showInCatalog: false,
        branches: { create: branch },
        menuCategories: {
          create: {
            name: 'Основное',
            items: { create: { name: HIDDEN_DISH, price: 300, photos: [] } },
          },
        },
      },
    });
    ids.hidden = hidden.id;
  });

  afterAll(async () => {
    const brandIds = [ids.brand, ids.hidden].filter(Boolean);
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

  describe('проверка запроса', () => {
    it('без q → 400', async () => {
      await api().get('/api/search').expect(400);
    });

    it('одна буква → 400, а не половина базы', async () => {
      await search('ш').expect(400);
    });

    it('одни пробелы → 400 (обрезаем ДО проверки длины)', async () => {
      await search('    ').expect(400);
    });
  });

  it('гостю поиск открыт — вход у нас только на оформлении', async () => {
    const res = await search(`Квортекс ${SUFFIX}`).expect(200);

    expect(res.body).toHaveProperty('restaurants');
    expect(res.body).toHaveProperty('dishes');
  });

  describe('заведения', () => {
    it('находит по вхождению в название, без учёта регистра', async () => {
      const res = await search(`шаурмятня квортекс ${SUFFIX}`).expect(200);

      expect(res.body.restaurants.map((r: { id: string }) => r.id)).toContain(
        ids.brand,
      );
    });

    it('находит по кухне, набранной строчными', async () => {
      const res = await search(CUISINE.toLowerCase()).expect(200);

      expect(res.body.restaurants.map((r: { id: string }) => r.id)).toContain(
        ids.brand,
      );
    });

    it('скрытый партнёром бренд не показывается', async () => {
      const res = await search(`Скрытая Квортекс ${SUFFIX}`).expect(200);

      expect(res.body.restaurants).toHaveLength(0);
    });
  });

  describe('блюда', () => {
    it('находит блюдо, а не только заведение с таким словом', async () => {
      const res = await search(DISH).expect(200);

      const names = res.body.dishes.map((d: { name: string }) => d.name);
      expect(names).toContain(DISH);
    });

    it('несёт бренд блюда — иначе из выдачи некуда идти', async () => {
      const res = await search(DISH).expect(200);
      const found = res.body.dishes.find(
        (d: { name: string }) => d.name === DISH,
      );

      expect(found.restaurant).toMatchObject({
        id: ids.brand,
        name: BRAND,
        slug: `e2e-search-${SUFFIX}`,
      });
    });

    it('блюдо скрытого бренда не показывается', async () => {
      const res = await search(HIDDEN_DISH).expect(200);

      expect(res.body.dishes).toHaveLength(0);
    });
  });

  it('ничего не нашлось → обе группы пустые, а не 404', async () => {
    const res = await search(`нетакогоблюда-${SUFFIX}`).expect(200);

    expect(res.body).toEqual({ restaurants: [], dishes: [] });
  });
});
