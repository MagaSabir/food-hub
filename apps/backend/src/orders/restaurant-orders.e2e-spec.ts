import {
  ErrorCodes,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from '@foodhubme/shared';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../app.module';
import { AuthTokenService } from '../auth/application/services/auth-token.service';
import { PrismaService } from '../prisma/prisma.service';
import { applyAppInitialization } from '../setup/app-initialization';

describe('Заказы ресторана (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const SUFFIX = String(Math.floor(Math.random() * 900000) + 100000);
  const CITY = `e2e-radm-city-${SUFFIX}`;

  const ids = {
    city: '',
    brand: '',
    otherBrand: '',
    branchA: '',
    branchB: '',
    otherBranch: '',
    item: '',
    otherItem: '',
    client: '',
    orderA: '',
    orderB: '',
    orderOther: '',
  };
  const numbers = { orderA: 0, orderB: 0 };

  const tokens = { client: '', staffA: '', owner: '', otherStaff: '' };

  const POINT = { latitude: 43.3178, longitude: 45.6949 };
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
  const asStaffA = () => `Bearer ${tokens.staffA}`;

  const placeOrder = async (
    brandId: string,
    branchId: string,
    menuItemId: string,
  ) => {
    const response = await api()
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        restaurantId: brandId,
        orderType: OrderType.PICKUP,
        branchId,
        paymentMethod: PaymentMethod.CASH,
        items: [{ menuItemId, quantity: 1, optionIds: [] }],
      })
      .expect(201);

    return response.body as { id: string; orderNumber: number };
  };

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

    const branch = (name: string, address: string) => ({
      cityId: city.id,
      name,
      address,
      phone: '+7 928 000-00-00',
      workingHours: alwaysOpen,
      ...POINT,
      minOrderAmount: 0,
      deliveryMaxRadiusKm: 10,
    });

    const brand = await prisma.client.restaurant.create({
      data: {
        name: `E2E Кухня ${SUFFIX}`,
        slug: `e2e-radm-${SUFFIX}`,
        cuisineTypes: [`e2e-${SUFFIX}`],
        branches: {
          create: [
            branch('Точка А', 'пр. В. Путина, 1'),
            branch('Точка Б', 'ул. Соседняя, 2'),
          ],
        },
        menuCategories: { create: { name: 'Пицца' } },
      },
      include: {
        branches: { orderBy: { name: 'asc' } },
        menuCategories: true,
      },
    });
    ids.brand = brand.id;
    ids.branchA = brand.branches.find((b) => b.name === 'Точка А')!.id;
    ids.branchB = brand.branches.find((b) => b.name === 'Точка Б')!.id;

    const pizza = await prisma.client.menuItem.create({
      data: {
        restaurantId: brand.id,
        categoryId: brand.menuCategories[0].id,
        name: 'Пицца Маргарита',
        price: 500,
      },
    });
    ids.item = pizza.id;

    const other = await prisma.client.restaurant.create({
      data: {
        name: `E2E Чужие ${SUFFIX}`,
        slug: `e2e-radm-other-${SUFFIX}`,
        cuisineTypes: [`e2e-${SUFFIX}`],
        branches: { create: [branch('Чужая', 'ул. Чужая, 3')] },
        menuCategories: { create: { name: 'Салаты' } },
      },
      include: { branches: true, menuCategories: true },
    });
    ids.otherBrand = other.id;
    ids.otherBranch = other.branches[0].id;

    const salad = await prisma.client.menuItem.create({
      data: {
        restaurantId: other.id,
        categoryId: other.menuCategories[0].id,
        name: 'Цезарь',
        price: 300,
      },
    });
    ids.otherItem = salad.id;

    const client = await prisma.client.user.create({
      data: { phone: `+7902${SUFFIX}1` },
    });
    ids.client = client.id;

    const authTokens = app.get(AuthTokenService);
    tokens.client = await authTokens.signAccess({
      sub: client.id,
      role: Role.CLIENT,
    });
    tokens.staffA = await authTokens.signAccess({
      sub: 'e2e-staff-a',
      role: Role.RESTAURANT_STAFF,
      restaurantId: ids.brand,
      branchId: ids.branchA,
    });
    tokens.owner = await authTokens.signAccess({
      sub: 'e2e-owner',
      role: Role.RESTAURANT_OWNER,
      restaurantId: ids.brand,
      branchId: null,
    });
    tokens.otherStaff = await authTokens.signAccess({
      sub: 'e2e-staff-other',
      role: Role.RESTAURANT_STAFF,
      restaurantId: ids.otherBrand,
      branchId: ids.otherBranch,
    });

    const a = await placeOrder(ids.brand, ids.branchA, ids.item);
    ids.orderA = a.id;
    numbers.orderA = a.orderNumber;

    const b = await placeOrder(ids.brand, ids.branchB, ids.item);
    ids.orderB = b.id;
    numbers.orderB = b.orderNumber;

    const foreign = await placeOrder(
      ids.otherBrand,
      ids.otherBranch,
      ids.otherItem,
    );
    ids.orderOther = foreign.id;
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
    if (ids.client)
      await prisma.client.user.deleteMany({ where: { id: ids.client } });
    if (ids.city)
      await prisma.client.city.deleteMany({ where: { id: ids.city } });

    await app.close();
  });

  describe('доступ', () => {
    it('гость без токена → 401', async () => {
      await api().get('/api/admin/restaurant/orders').expect(401);
    });

    it('клиент → 403 ACCESS_DENIED (это раздел ресторана)', async () => {
      const res = await api()
        .get('/api/admin/restaurant/orders')
        .set('Authorization', `Bearer ${tokens.client}`)
        .expect(403);

      expect(res.body.code).toBe(ErrorCodes.ACCESS_DENIED);
    });
  });

  describe('список', () => {
    const ourIds = (body: { id: string }[]) =>
      body
        .map((o) => o.id)
        .filter((id) => id === ids.orderA || id === ids.orderB);

    it('сотрудник точки видит СВОЮ точку и не видит соседнюю', async () => {
      const res = await api()
        .get('/api/admin/restaurant/orders')
        .set('Authorization', asStaffA())
        .expect(200);

      expect(ourIds(res.body as { id: string }[])).toEqual([ids.orderA]);
    });

    it('владелец бренда видит обе точки', async () => {
      const res = await api()
        .get('/api/admin/restaurant/orders')
        .set('Authorization', `Bearer ${tokens.owner}`)
        .expect(200);

      expect(ourIds(res.body as { id: string }[])).toEqual([
        ids.orderB,
        ids.orderA,
      ]);
    });

    it('чужой бренд не видит наших заказов вовсе', async () => {
      const res = await api()
        .get('/api/admin/restaurant/orders')
        .set('Authorization', `Bearer ${tokens.otherStaff}`)
        .expect(200);

      expect(ourIds(res.body as { id: string }[])).toEqual([]);
      expect(res.body.map((o: { id: string }) => o.id)).toContain(
        ids.orderOther,
      );
    });

    it('в строке — точка, сумма и число позиций, но НЕ состав заказа', async () => {
      const res = await api()
        .get('/api/admin/restaurant/orders')
        .set('Authorization', asStaffA())
        .expect(200);

      const row = res.body.find((o: { id: string }) => o.id === ids.orderA);

      expect(row).toMatchObject({
        orderNumber: numbers.orderA,
        status: OrderStatus.PENDING,
        orderType: OrderType.PICKUP,
        branchId: ids.branchA,
        branchAddress: 'пр. В. Путина, 1',
        deliveryAddress: null,
        itemsCount: 1,
        total: 500,
      });
      expect(row.items).toBeUndefined();
    });

    it('фильтр по статусу: в COMPLETED сейчас нет ничего', async () => {
      const res = await api()
        .get('/api/admin/restaurant/orders')
        .query({ status: OrderStatus.COMPLETED })
        .set('Authorization', asStaffA())
        .expect(200);

      expect(ourIds(res.body as { id: string }[])).toEqual([]);
    });

    it('неизвестный статус → 400, а не молча весь список', async () => {
      const res = await api()
        .get('/api/admin/restaurant/orders')
        .query({ status: 'КОГДА-НИБУДЬ' })
        .set('Authorization', asStaffA())
        .expect(400);

      expect(res.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });
  });

  describe('карточка заказа', () => {
    it('свой заказ отдаётся с составом и телефоном для связи', async () => {
      const res = await api()
        .get(`/api/admin/restaurant/orders/${ids.orderA}`)
        .set('Authorization', asStaffA())
        .expect(200);

      expect(res.body.orderNumber).toBe(numbers.orderA);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].name).toBe('Пицца Маргарита');
      expect(res.body.contactPhone).toEqual(expect.any(String));
    });

    it('заказ соседней точки → 404, как несуществующий', async () => {
      const res = await api()
        .get(`/api/admin/restaurant/orders/${ids.orderB}`)
        .set('Authorization', asStaffA())
        .expect(404);

      expect(res.body.code).toBe(ErrorCodes.ORDER_NOT_FOUND);
    });

    it('заказ чужого бренда → 404 и владельцу тоже', async () => {
      const res = await api()
        .get(`/api/admin/restaurant/orders/${ids.orderOther}`)
        .set('Authorization', `Bearer ${tokens.owner}`)
        .expect(404);

      expect(res.body.code).toBe(ErrorCodes.ORDER_NOT_FOUND);
    });

    it('владельцу видны заказы обеих своих точек', async () => {
      await api()
        .get(`/api/admin/restaurant/orders/${ids.orderB}`)
        .set('Authorization', `Bearer ${tokens.owner}`)
        .expect(200);
    });
  });
  describe('действия ресторана (Шаги 5.3 и 5.4)', () => {
    const freshOrder = () => placeOrder(ids.brand, ids.branchA, ids.item);

    const patch = (orderId: string, action: string) =>
      api()
        .patch(`/api/admin/restaurant/orders/${orderId}/${action}`)
        .set('Authorization', asStaffA());

    const auditOf = async (
      orderId: string,
    ): Promise<[OrderStatus, string][]> => {
      const rows = await prisma.client.orderStatusLog.findMany({
        where: { orderId },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map((r) => [r.status as OrderStatus, r.changedBy]);
    };

    it('весь путь самовывоза: принят (и сразу в работе) → готов → выдан', async () => {
      const order = await freshOrder();

      const accepted = await patch(order.id, 'accept')
        .send({ prepMinutes: 25 })
        .expect(200);

      expect(accepted.body.status).toBe(OrderStatus.PREPARING);
      expect(accepted.body.prepMinutes).toBe(25);

      for (const status of [OrderStatus.READY, OrderStatus.COMPLETED]) {
        const res = await patch(order.id, 'status')
          .send({ status })
          .expect(200);
        expect(res.body.status).toBe(status);
      }

      const row = await prisma.client.order.findUniqueOrThrow({
        where: { id: order.id },
      });

      expect(row.acceptedAt).not.toBeNull();
      expect(row.dispatchedAt).not.toBeNull();
      expect(row.completedAt).not.toBeNull();
      expect(row.prepMinutes).toBe(25);

      expect(await auditOf(order.id)).toEqual([
        [OrderStatus.PENDING, 'user'],
        [OrderStatus.ACCEPTED, 'staff:e2e-staff-a'],
        [OrderStatus.PREPARING, 'system'],
        [OrderStatus.READY, 'staff:e2e-staff-a'],
        [OrderStatus.COMPLETED, 'staff:e2e-staff-a'],
      ]);
    });

    it('повторное «Принять» отвечает заказом и НЕ пишет в журнал (5.4)', async () => {
      const order = await freshOrder();

      await patch(order.id, 'accept').send({ prepMinutes: 20 }).expect(200);
      const before = await auditOf(order.id);

      const again = await patch(order.id, 'accept')
        .send({ prepMinutes: 20 })
        .expect(200);

      expect(again.body.status).toBe(OrderStatus.PREPARING);
      expect(await auditOf(order.id)).toEqual(before);
    });

    it('два сотрудника жмут «Принять» одновременно — принято ОДИН раз (5.4)', async () => {
      const order = await freshOrder();

      const [first, second] = await Promise.all([
        patch(order.id, 'accept').send({ prepMinutes: 15 }),
        patch(order.id, 'accept').send({ prepMinutes: 15 }),
      ]);

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);

      const audit = await auditOf(order.id);
      expect(audit.filter(([s]) => s === OrderStatus.ACCEPTED)).toHaveLength(1);
      expect(audit.filter(([s]) => s === OrderStatus.PREPARING)).toHaveLength(
        1,
      );
    });

    it('отказ с причиной: статус, причина и запись в аудите', async () => {
      const order = await freshOrder();

      const res = await patch(order.id, 'reject')
        .send({ reason: 'Закончилось тесто' })
        .expect(200);

      expect(res.body.status).toBe(OrderStatus.CANCELLED);
      expect(res.body.cancelReason).toBe('Закончилось тесто');

      expect(await auditOf(order.id)).toEqual([
        [OrderStatus.PENDING, 'user'],
        [OrderStatus.CANCELLED, 'staff:e2e-staff-a'],
      ]);
    });

    it('повторный отказ не меняет первую причину', async () => {
      const order = await freshOrder();

      await patch(order.id, 'reject').send({ reason: 'первая причина' });
      const res = await patch(order.id, 'reject')
        .send({ reason: 'вторая причина' })
        .expect(200);

      expect(res.body.cancelReason).toBe('первая причина');
    });

    it('отменить доигранный заказ нельзя → 409', async () => {
      const order = await freshOrder();
      await patch(order.id, 'accept').send({ prepMinutes: 10 }).expect(200);
      await patch(order.id, 'status')
        .send({ status: OrderStatus.READY })
        .expect(200);
      await patch(order.id, 'status')
        .send({ status: OrderStatus.COMPLETED })
        .expect(200);

      const res = await patch(order.id, 'reject')
        .send({ reason: 'передумали' })
        .expect(409);

      expect(res.body.code).toBe(ErrorCodes.ORDER_STATUS_CONFLICT);
    });

    it('перескок через шаг → 409, заказ остаётся как был', async () => {
      const order = await freshOrder();

      const res = await patch(order.id, 'status')
        .send({ status: OrderStatus.COMPLETED })
        .expect(409);

      expect(res.body.code).toBe(ErrorCodes.ORDER_STATUS_CONFLICT);

      const row = await prisma.client.order.findUniqueOrThrow({
        where: { id: order.id },
      });
      expect(row.status).toBe(OrderStatus.PENDING);
    });

    it('ON_THE_WAY у самовывоза → 409: везти некому', async () => {
      const order = await freshOrder();
      await patch(order.id, 'accept').send({ prepMinutes: 10 }).expect(200);

      const res = await patch(order.id, 'status')
        .send({ status: OrderStatus.ON_THE_WAY })
        .expect(409);

      expect(res.body.code).toBe(ErrorCodes.ORDER_STATUS_CONFLICT);
    });

    it('принять без времени готовки нельзя → 400', async () => {
      const order = await freshOrder();

      const res = await patch(order.id, 'accept').send({}).expect(400);

      expect(res.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('отказ прочерком вместо причины → 400', async () => {
      const order = await freshOrder();

      await patch(order.id, 'reject').send({ reason: '-' }).expect(400);
    });

    it('приём и отказ общим эндпоинтом статуса не проходят → 400', async () => {
      const order = await freshOrder();

      await patch(order.id, 'status')
        .send({ status: OrderStatus.ACCEPTED })
        .expect(400);
      await patch(order.id, 'status')
        .send({ status: OrderStatus.CANCELLED })
        .expect(400);
    });

    it('чужой точке заказ не принять → 404, как несуществующий', async () => {
      const order = await placeOrder(ids.brand, ids.branchB, ids.item);

      const res = await api()
        .patch(`/api/admin/restaurant/orders/${order.id}/accept`)
        .set('Authorization', asStaffA())
        .send({ prepMinutes: 20 })
        .expect(404);

      expect(res.body.code).toBe(ErrorCodes.ORDER_NOT_FOUND);

      const row = await prisma.client.order.findUniqueOrThrow({
        where: { id: order.id },
      });
      expect(row.status).toBe(OrderStatus.PENDING);
    });

    it('клиент свой заказ статусами не двигает → 403', async () => {
      const order = await freshOrder();

      const res = await api()
        .patch(`/api/admin/restaurant/orders/${order.id}/accept`)
        .set('Authorization', `Bearer ${tokens.client}`)
        .send({ prepMinutes: 5 })
        .expect(403);

      expect(res.body.code).toBe(ErrorCodes.ACCESS_DENIED);
    });
  });
});
