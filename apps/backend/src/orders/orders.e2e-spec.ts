import {
  ErrorCodes,
  ModifierType,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from '@foodhubme/shared';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../app.module';
import { AuthTokenService } from '../auth/application/services/auth-token.service';
import { PrismaService } from '../prisma/prisma.service';
import { applyAppInitialization } from '../setup/app-initialization';

describe('Оформление заказа (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const SUFFIX = String(Math.floor(Math.random() * 900000) + 100000);
  const CITY = `e2e-order-city-${SUFFIX}`;
  const BRAND = `e2e-order-${SUFFIX}`;
  const OTHER_BRAND = `e2e-order-other-${SUFFIX}`;

  const ids = {
    city: '',
    brand: '',
    otherBrand: '',
    openBranch: '',
    closedBranch: '',
    category: '',
    pizza: '',
    pizzaWithSize: '',
    sizeSmall: '',
    sizeLarge: '',
    foreignItem: '',
    alice: '',
    bob: '',
  };
  const tokens = { alice: '', bob: '', staff: '' };

  const ALICE_PHONE = `+7900${SUFFIX}1`;

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
  const alwaysClosed = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };

  const BRANCH_POINT = { latitude: 43.3178, longitude: 45.6949 };
  const NEAR_ADDRESS = {
    address: 'г. Грозный, пр. Путина, 12',
    latitude: 43.3268,
    longitude: 45.6949,
  };
  const FAR_ADDRESS = {
    address: 'с. Дальнее',
    latitude: 43.68,
    longitude: 45.6949,
  };

  const api = () => request(app.getHttpServer());
  const asAlice = (req: request.Test) =>
    req.set('Authorization', `Bearer ${tokens.alice}`);

  const cart = () => [{ menuItemId: ids.pizza, quantity: 2 }];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    applyAppInitialization(app);
    await app.init();

    prisma = app.get(PrismaService);
    const authTokens = app.get(AuthTokenService);

    const city = await prisma.client.city.create({
      data: { name: CITY, slug: CITY },
    });
    ids.city = city.id;

    const brand = await prisma.client.restaurant.create({
      data: {
        name: `E2E Заказы ${SUFFIX}`,
        slug: BRAND,
        cuisineTypes: [`e2e-${SUFFIX}`],
        branches: {
          create: [
            {
              cityId: city.id,
              name: 'Открытая',
              address: 'пр. В. Путина, 1',
              phone: '+7 928 000-00-00',
              workingHours: alwaysOpen,
              ...BRANCH_POINT,
              minOrderAmount: 0,
              deliveryBaseFee: 149,
              deliveryIncludedRadiusKm: 3,
              deliveryPerKm: 30,
              deliveryMaxRadiusKm: 10,
            },
            {
              cityId: city.id,
              name: 'Закрытая',
              address: 'ул. Ночная, 2',
              phone: '+7 928 000-00-01',
              workingHours: alwaysClosed,
              ...BRANCH_POINT,
              deliveryMaxRadiusKm: 10,
            },
          ],
        },
      },
      include: { branches: { orderBy: { name: 'asc' } } },
    });
    ids.brand = brand.id;
    ids.openBranch = brand.branches.find((b) => b.name === 'Открытая')!.id;
    ids.closedBranch = brand.branches.find((b) => b.name === 'Закрытая')!.id;

    const category = await prisma.client.menuCategory.create({
      data: { restaurantId: brand.id, name: 'Пицца' },
    });
    ids.category = category.id;

    const pizza = await prisma.client.menuItem.create({
      data: {
        restaurantId: brand.id,
        categoryId: category.id,
        name: 'Пицца Маргарита',
        price: 500,
      },
    });
    ids.pizza = pizza.id;

    const withSize = await prisma.client.menuItem.create({
      data: {
        restaurantId: brand.id,
        categoryId: category.id,
        name: 'Пицца Пепперони',
        price: 500,
        modifierGroups: {
          create: {
            name: 'Размер',
            type: ModifierType.SINGLE,
            isRequired: true,
            minSelections: 1,
            maxSelections: 1,
            options: {
              create: [
                { name: '25 см', priceDelta: 0, sortOrder: 1 },
                { name: '30 см', priceDelta: 150, sortOrder: 2 },
              ],
            },
          },
        },
      },
      include: { modifierGroups: { include: { options: true } } },
    });
    ids.pizzaWithSize = withSize.id;
    const options = withSize.modifierGroups[0].options;
    ids.sizeSmall = options.find((o) => o.name === '25 см')!.id;
    ids.sizeLarge = options.find((o) => o.name === '30 см')!.id;

    const other = await prisma.client.restaurant.create({
      data: {
        name: `E2E Чужой ${SUFFIX}`,
        slug: OTHER_BRAND,
        cuisineTypes: [`e2e-${SUFFIX}`],
        menuCategories: { create: { name: 'Салаты' } },
      },
      include: { menuCategories: true },
    });
    ids.otherBrand = other.id;

    const foreignItem = await prisma.client.menuItem.create({
      data: {
        restaurantId: other.id,
        categoryId: other.menuCategories[0].id,
        name: 'Цезарь',
        price: 300,
      },
    });
    ids.foreignItem = foreignItem.id;

    const alice = await prisma.client.user.create({
      data: { phone: ALICE_PHONE },
    });
    ids.alice = alice.id;
    const bob = await prisma.client.user.create({
      data: { phone: `+7901${SUFFIX}1` },
    });
    ids.bob = bob.id;

    tokens.alice = await authTokens.signAccess({
      sub: alice.id,
      role: Role.CLIENT,
    });
    tokens.bob = await authTokens.signAccess({
      sub: bob.id,
      role: Role.CLIENT,
    });
    tokens.staff = await authTokens.signAccess({
      sub: 'aaaaaaaa-0000-4000-8000-000000000001',
      role: Role.RESTAURANT_OWNER,
      restaurantId: brand.id,
      branchId: null,
    });
  });

  afterAll(async () => {
    const brandIds = [ids.brand, ids.otherBrand].filter(Boolean);
    await prisma.client.order.deleteMany({
      where: { restaurantId: { in: brandIds } },
    });
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
    const userIds = [ids.alice, ids.bob].filter(Boolean);
    if (userIds.length)
      await prisma.client.user.deleteMany({ where: { id: { in: userIds } } });
    if (ids.city)
      await prisma.client.city.deleteMany({ where: { id: ids.city } });
    await app.close();
  });

  const countOrders = () =>
    prisma.client.order.count({ where: { restaurantId: ids.brand } });

  describe('доступ', () => {
    it('гость без токена → 401 (заказ принадлежит аккаунту)', async () => {
      await api()
        .post('/api/orders')
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.openBranch,
          paymentMethod: PaymentMethod.CASH,
          items: cart(),
        })
        .expect(401);
    });

    it('сотрудник ресторана → 403 ACCESS_DENIED', async () => {
      const res = await api()
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokens.staff}`)
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.openBranch,
          paymentMethod: PaymentMethod.CASH,
          items: cart(),
        })
        .expect(403);

      expect(res.body.code).toBe(ErrorCodes.ACCESS_DENIED);
    });
  });

  describe('три типа заказа', () => {
    it('DELIVERY: точку выбрал сервер, доставка посчитана, заказ в базе', async () => {
      const res = await asAlice(api().post('/api/orders'))
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.DELIVERY,
          paymentMethod: PaymentMethod.CASH,
          items: cart(),
          delivery: { ...NEAR_ADDRESS, details: 'подъезд 2, этаж 5' },
          comment: 'Домофон не работает',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        status: OrderStatus.PENDING,
        orderType: OrderType.DELIVERY,
        branchId: ids.openBranch,
        itemsTotal: 1000,
        deliveryFee: 149,
        discountAmount: 0,
        total: 1149,
        deliveryAddress: NEAR_ADDRESS.address,
        deliveryDetails: 'подъезд 2, этаж 5',
        contactPhone: ALICE_PHONE,
        paymentMethod: PaymentMethod.CASH,
        restaurantName: `E2E Заказы ${SUFFIX}`,
      });
      expect(res.body.orderNumber).toBeGreaterThan(0);
      expect(res.body.distanceKm).toBeGreaterThan(0);

      const saved = await prisma.client.order.findUniqueOrThrow({
        where: { id: res.body.id },
        include: { items: true, statusLog: true },
      });
      expect(saved.userId).toBe(ids.alice);
      expect(saved.items).toHaveLength(1);
      expect(saved.items[0].nameSnapshot).toBe('Пицца Маргарита');
      expect(saved.items[0].lineTotal.toString()).toBe('1000');
      expect(saved.statusLog).toHaveLength(1);
      expect(saved.statusLog[0]).toMatchObject({
        status: OrderStatus.PENDING,
        changedBy: 'user',
      });
    });

    it('PICKUP: точку назвал клиент, доставка 0, модификаторы легли снимками', async () => {
      const res = await asAlice(api().post('/api/orders'))
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.openBranch,
          paymentMethod: PaymentMethod.CASH,
          items: [
            {
              menuItemId: ids.pizzaWithSize,
              quantity: 1,
              optionIds: [ids.sizeLarge],
            },
          ],
          contactPhone: `+7900${SUFFIX}2`,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        orderType: OrderType.PICKUP,
        branchId: ids.openBranch,
        deliveryFee: 0,
        deliveryAddress: null,
        distanceKm: null,
        itemsTotal: 650,
        total: 650,
        contactPhone: `+7900${SUFFIX}2`,
      });
      expect(res.body.items[0].modifiers).toEqual([
        { groupName: 'Размер', optionName: '30 см', priceDelta: 150 },
      ]);
    });

    it('DINE_IN: заказ в зале, без адреса и без доставки', async () => {
      const res = await asAlice(api().post('/api/orders'))
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.DINE_IN,
          branchId: ids.openBranch,
          paymentMethod: PaymentMethod.CASH,
          items: cart(),
        })
        .expect(201);

      expect(res.body).toMatchObject({
        orderType: OrderType.DINE_IN,
        deliveryFee: 0,
        deliveryAddress: null,
        total: 1000,
      });
    });
  });

  describe('когда заказ создавать нельзя', () => {
    it('закрытая точка → 400 ORDER_NOT_AVAILABLE, заказа не появилось', async () => {
      const before = await countOrders();

      const res = await asAlice(api().post('/api/orders'))
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.closedBranch,
          paymentMethod: PaymentMethod.CASH,
          items: cart(),
        })
        .expect(400);

      expect(res.body.code).toBe(ErrorCodes.ORDER_NOT_AVAILABLE);
      expect(await countOrders()).toBe(before);
    });

    it('адрес вне зоны доставки → 400 с расстоянием в сообщении', async () => {
      const res = await asAlice(api().post('/api/orders'))
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.DELIVERY,
          paymentMethod: PaymentMethod.CASH,
          items: cart(),
          delivery: FAR_ADDRESS,
        })
        .expect(400);

      expect(res.body.code).toBe(ErrorCodes.ORDER_NOT_AVAILABLE);
      expect(res.body.message).toContain('км');
    });

    it('онлайн-оплата пока не подключена → 400', async () => {
      const res = await asAlice(api().post('/api/orders'))
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.openBranch,
          paymentMethod: PaymentMethod.ONLINE,
          items: cart(),
        })
        .expect(400);

      expect(res.body.code).toBe(ErrorCodes.PAYMENT_METHOD_UNAVAILABLE);
    });

    it('блюдо чужого бренда → 404, изоляция по restaurant_id держится', async () => {
      const res = await asAlice(api().post('/api/orders'))
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.openBranch,
          paymentMethod: PaymentMethod.CASH,
          items: [{ menuItemId: ids.foreignItem, quantity: 1 }],
        })
        .expect(404);

      expect(res.body.code).toBe(ErrorCodes.MENU_ITEM_NOT_FOUND);
    });

    it('не выбран обязательный размер → 400 и НИ ОДНОЙ строки в базе', async () => {
      const before = await countOrders();

      const res = await asAlice(api().post('/api/orders'))
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.openBranch,
          paymentMethod: PaymentMethod.CASH,
          items: [{ menuItemId: ids.pizzaWithSize, quantity: 1 }],
        })
        .expect(400);

      expect(res.body.code).toBe(ErrorCodes.INVALID_MODIFIERS);
      expect(await countOrders()).toBe(before);
    });

    it('пустая корзина отбивается ещё формой запроса', async () => {
      const res = await asAlice(api().post('/api/orders'))
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.openBranch,
          paymentMethod: PaymentMethod.CASH,
          items: [],
        })
        .expect(400);

      expect(res.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });
  });

  describe('снимки', () => {
    it('цену и название в меню поменяли — чек прежний', async () => {
      const created = await asAlice(api().post('/api/orders'))
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.openBranch,
          paymentMethod: PaymentMethod.CASH,
          items: [{ menuItemId: ids.pizza, quantity: 1 }],
        })
        .expect(201);

      await prisma.client.menuItem.update({
        where: { id: ids.pizza },
        data: { name: 'Маргарита XXL', price: 900 },
      });

      const saved = await prisma.client.order.findUniqueOrThrow({
        where: { id: created.body.id },
        include: { items: true },
      });

      expect(saved.items[0].nameSnapshot).toBe('Пицца Маргарита');
      expect(saved.items[0].basePriceSnapshot.toString()).toBe('500');
      expect(saved.total.toString()).toBe('500');

      await prisma.client.menuItem.update({
        where: { id: ids.pizza },
        data: { name: 'Пицца Маргарита', price: 500 },
      });
    });

    it('цену из тела запроса backend игнорирует', async () => {
      const res = await asAlice(api().post('/api/orders'))
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.openBranch,
          paymentMethod: PaymentMethod.CASH,
          items: [{ menuItemId: ids.pizza, quantity: 1, price: 1 }],
          total: 1,
        })
        .expect(201);

      expect(res.body.total).toBe(500);
    });
  });

  describe('мои заказы и заказ по id (Шаг 4.5)', () => {
    let myOrderId = '';

    beforeAll(async () => {
      const created = await asAlice(api().post('/api/orders'))
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.openBranch,
          paymentMethod: PaymentMethod.CASH,
          items: [
            {
              menuItemId: ids.pizzaWithSize,
              quantity: 1,
              optionIds: [ids.sizeSmall],
            },
          ],
        })
        .expect(201);

      myOrderId = created.body.id as string;
    });

    it('гость без токена → 401 на обоих эндпоинтах', async () => {
      await api().get('/api/orders/mine').expect(401);
      await api().get(`/api/orders/${myOrderId}`).expect(401);
    });

    it('список: свежие сверху, форма КОРОТКАЯ (состав не шлём)', async () => {
      const res = await asAlice(api().get('/api/orders/mine')).expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toBe(myOrderId);
      expect(res.body[0]).toMatchObject({
        restaurantName: `E2E Заказы ${SUFFIX}`,
        branchAddress: 'пр. В. Путина, 1',
        status: OrderStatus.PENDING,
        itemsCount: 1,
        total: 500,
      });
      expect(res.body[0].items).toBeUndefined();
    });

    it('ИЗОЛЯЦИЯ: у второго клиента список пуст, хотя заказы в системе есть', async () => {
      const res = await api()
        .get('/api/orders/mine')
        .set('Authorization', `Bearer ${tokens.bob}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('свой заказ по id — полная карточка со снимками', async () => {
      const res = await asAlice(api().get(`/api/orders/${myOrderId}`)).expect(
        200,
      );

      expect(res.body).toMatchObject({
        id: myOrderId,
        orderType: OrderType.PICKUP,
        status: OrderStatus.PENDING,
        total: 500,
      });
      expect(res.body.items[0]).toMatchObject({
        name: 'Пицца Пепперони',
        quantity: 1,
      });
      expect(res.body.items[0].modifiers).toEqual([
        { groupName: 'Размер', optionName: '25 см', priceDelta: 0 },
      ]);
    });

    it('ИЗОЛЯЦИЯ: чужой заказ по id → 404, как несуществующий', async () => {
      const res = await api()
        .get(`/api/orders/${myOrderId}`)
        .set('Authorization', `Bearer ${tokens.bob}`)
        .expect(404);

      expect(res.body.code).toBe(ErrorCodes.ORDER_NOT_FOUND);
    });

    it('несуществующий заказ → тот же 404 ORDER_NOT_FOUND', async () => {
      const res = await asAlice(
        api().get('/api/orders/00000000-0000-4000-8000-000000000000'),
      ).expect(404);

      expect(res.body.code).toBe(ErrorCodes.ORDER_NOT_FOUND);
    });

    it('сотрудник ресторана в историю клиента не ходит → 403', async () => {
      await api()
        .get('/api/orders/mine')
        .set('Authorization', `Bearer ${tokens.staff}`)
        .expect(403);
    });
  });
});
