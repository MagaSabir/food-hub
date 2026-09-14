import { AddressInfo } from 'node:net';
import {
  ErrorCodes,
  NewOrderEvent,
  OrderStatus,
  OrderStatusEvent,
  OrderType,
  OrderUpdatedEvent,
  PaymentMethod,
  WS_EVENTS,
  WS_NAMESPACES,
  WsConnectErrorData,
} from '@foodhubme/shared';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../app.module';
import { AuthTokenService } from '../auth/application/services/auth-token.service';
import { AuthSubjectType } from '../auth/domain/types/auth-subject';
import { PrismaService } from '../prisma/prisma.service';
import { applyAppInitialization } from '../setup/app-initialization';

describe('Живой канал WebSocket (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let url: string;
  const open: Socket[] = [];

  const tokens = {
    client: '',
    otherClient: '',
    staff: '',
    neighbourStaff: '',
    owner: '',
    platform: '',
  };

  const SUFFIX = String(Math.floor(Math.random() * 900000) + 100000);
  const CITY = `e2e-ws-city-${SUFFIX}`;
  const BRAND = `e2e-ws-${SUFFIX}`;

  const ids = {
    city: '',
    brand: '',
    branch: '',
    neighbourBranch: '',
    item: '',
    alice: '',
    bob: '',
  };

  const BRANCH_POINT = { latitude: 43.3178, longitude: 45.6949 };
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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    applyAppInitialization(app);
    await app.listen(0);

    const { port } = app.getHttpServer().address() as AddressInfo;
    url = `http://127.0.0.1:${port}`;

    prisma = app.get(PrismaService);

    const city = await prisma.client.city.create({
      data: { name: CITY, slug: CITY },
    });
    ids.city = city.id;

    const brand = await prisma.client.restaurant.create({
      data: {
        name: `E2E Живые заказы ${SUFFIX}`,
        slug: BRAND,
        cuisineTypes: [`e2e-${SUFFIX}`],
        branches: {
          create: [
            {
              cityId: city.id,
              name: 'Своя',
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
              name: 'Соседняя',
              address: 'ул. Соседняя, 2',
              phone: '+7 928 000-00-01',
              workingHours: alwaysOpen,
              ...BRANCH_POINT,
              minOrderAmount: 0,
              deliveryMaxRadiusKm: 10,
            },
          ],
        },
      },
      include: { branches: { orderBy: { name: 'asc' } } },
    });
    ids.brand = brand.id;
    ids.branch = brand.branches.find((b) => b.name === 'Своя')!.id;
    ids.neighbourBranch = brand.branches.find((b) => b.name === 'Соседняя')!.id;

    const category = await prisma.client.menuCategory.create({
      data: { restaurantId: brand.id, name: 'Пицца' },
    });
    const pizza = await prisma.client.menuItem.create({
      data: {
        restaurantId: brand.id,
        categoryId: category.id,
        name: 'Пицца Маргарита',
        price: 500,
      },
    });
    ids.item = pizza.id;

    const alice = await prisma.client.user.create({
      data: { phone: `+7900${SUFFIX}1` },
    });
    ids.alice = alice.id;

    const bob = await prisma.client.user.create({
      data: { phone: `+7900${SUFFIX}2` },
    });
    ids.bob = bob.id;

    const authTokens = app.get(AuthTokenService);
    tokens.client = await authTokens.signAccess({
      sub: alice.id,
      role: Role.CLIENT,
    });
    tokens.otherClient = await authTokens.signAccess({
      sub: bob.id,
      role: Role.CLIENT,
    });
    tokens.staff = await authTokens.signAccess({
      sub: 'e2e-staff',
      role: Role.RESTAURANT_STAFF,
      restaurantId: ids.brand,
      branchId: ids.branch,
    });
    tokens.neighbourStaff = await authTokens.signAccess({
      sub: 'e2e-staff-2',
      role: Role.RESTAURANT_STAFF,
      restaurantId: ids.brand,
      branchId: ids.neighbourBranch,
    });
    tokens.owner = await authTokens.signAccess({
      sub: 'e2e-owner',
      role: Role.RESTAURANT_OWNER,
      restaurantId: ids.brand,
      branchId: null,
    });
    tokens.platform = await authTokens.signAccess({
      sub: 'e2e-platform',
      role: Role.PLATFORM_ADMIN,
    });
  });

  afterEach(() => {
    while (open.length) open.pop()?.disconnect();
  });

  afterAll(async () => {
    if (ids.brand) {
      await prisma.client.order.deleteMany({
        where: { restaurantId: ids.brand },
      });
      await prisma.client.menuItem.deleteMany({
        where: { restaurantId: ids.brand },
      });
      await prisma.client.menuCategory.deleteMany({
        where: { restaurantId: ids.brand },
      });
      await prisma.client.branch.deleteMany({
        where: { restaurantId: ids.brand },
      });
      await prisma.client.restaurant.deleteMany({ where: { id: ids.brand } });
    }
    const userIds = [ids.alice, ids.bob].filter(Boolean);
    if (userIds.length)
      await prisma.client.user.deleteMany({ where: { id: { in: userIds } } });
    if (ids.city)
      await prisma.client.city.deleteMany({ where: { id: ids.city } });

    await app.close();
  });

  const connect = (namespace: string, token?: string): Promise<Socket> =>
    new Promise((resolve, reject) => {
      const socket = io(`${url}${namespace}`, {
        transports: ['websocket'],
        reconnection: false,
        auth: token ? { token } : {},
      });
      open.push(socket);

      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', reject);
    });

  const codeOf = (error: unknown): string | undefined =>
    (error as { data?: WsConnectErrorData }).data?.code;

  describe('дверь клиента', () => {
    it('клиент с валидным токеном подключается', async () => {
      await expect(
        connect(WS_NAMESPACES.CLIENT, tokens.client),
      ).resolves.toBeDefined();
    });

    it('без токена — отказ в рукопожатии', async () => {
      const error = await connect(WS_NAMESPACES.CLIENT).catch(
        (e: unknown) => e,
      );

      expect(codeOf(error)).toBe(ErrorCodes.INVALID_ACCESS_TOKEN);
    });

    it('подделанный токен не проходит', async () => {
      const error = await connect(
        WS_NAMESPACES.CLIENT,
        `${tokens.client}xx`,
      ).catch((e: unknown) => e);

      expect(codeOf(error)).toBe(ErrorCodes.INVALID_ACCESS_TOKEN);
    });

    it('сотруднику ресторана в клиентскую дверь нельзя', async () => {
      const error = await connect(WS_NAMESPACES.CLIENT, tokens.staff).catch(
        (e: unknown) => e,
      );

      expect(codeOf(error)).toBe(ErrorCodes.ACCESS_DENIED);
    });
  });

  describe('дверь ресторана', () => {
    it('сотрудник точки подключается', async () => {
      await expect(
        connect(WS_NAMESPACES.RESTAURANT, tokens.staff),
      ).resolves.toBeDefined();
    });

    it('владелец бренда подключается', async () => {
      await expect(
        connect(WS_NAMESPACES.RESTAURANT, tokens.owner),
      ).resolves.toBeDefined();
    });

    it('клиенту в дверь ресторана нельзя', async () => {
      const error = await connect(
        WS_NAMESPACES.RESTAURANT,
        tokens.client,
      ).catch((e: unknown) => e);

      expect(codeOf(error)).toBe(ErrorCodes.ACCESS_DENIED);
    });

    it('админу платформы тоже нельзя — у него свои экраны', async () => {
      const error = await connect(
        WS_NAMESPACES.RESTAURANT,
        tokens.platform,
      ).catch((e: unknown) => e);

      expect(codeOf(error)).toBe(ErrorCodes.ACCESS_DENIED);
    });
  });

  it('refresh-токен доступа не открывает: у него другая подпись', async () => {
    const authTokens = app.get(AuthTokenService);
    const { token } = await authTokens.signRefresh({
      sub: ids.alice,
      subjectType: AuthSubjectType.CLIENT,
      sessionId: 'e2e-session',
    });

    const error = await connect(WS_NAMESPACES.CLIENT, token).catch(
      (e: unknown) => e,
    );

    expect(codeOf(error)).toBe(ErrorCodes.INVALID_ACCESS_TOKEN);
  });

  describe('новый заказ уходит на точку (Шаг 5.2)', () => {
    const nextEvent = (socket: Socket): Promise<NewOrderEvent> =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('событие order:new не пришло')),
          5000,
        );
        socket.once(WS_EVENTS.ORDER_NEW, (payload: NewOrderEvent) => {
          clearTimeout(timer);
          resolve(payload);
        });
      });

    const collect = (socket: Socket): NewOrderEvent[] => {
      const received: NewOrderEvent[] = [];
      socket.on(WS_EVENTS.ORDER_NEW, (payload: NewOrderEvent) =>
        received.push(payload),
      );
      return received;
    };

    const placeOrder = () =>
      request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokens.client}`)
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.branch,
          paymentMethod: PaymentMethod.CASH,
          items: [{ menuItemId: ids.item, quantity: 1, optionIds: [] }],
        })
        .expect(201);

    it('приходит своей точке и владельцу, но не соседней и не клиенту', async () => {
      const [staff, neighbour, owner, client] = await Promise.all([
        connect(WS_NAMESPACES.RESTAURANT, tokens.staff),
        connect(WS_NAMESPACES.RESTAURANT, tokens.neighbourStaff),
        connect(WS_NAMESPACES.RESTAURANT, tokens.owner),
        connect(WS_NAMESPACES.CLIENT, tokens.client),
      ]);

      const onStaff = nextEvent(staff);
      const onOwner = nextEvent(owner);
      const silentNeighbour = collect(neighbour);
      const silentClient = collect(client);

      const response = await placeOrder();
      const event = await onStaff;

      expect(event.orderId).toBe(response.body.id);
      expect(event.orderNumber).toBe(response.body.orderNumber);
      expect(event.branchId).toBe(ids.branch);
      expect(new Date(event.createdAt).getTime()).not.toBeNaN();

      await expect(onOwner).resolves.toMatchObject({
        orderId: response.body.id,
      });

      expect(silentNeighbour).toEqual([]);
      expect(silentClient).toEqual([]);
    });

    it('заказ создаётся, даже если ресторан не подключён', async () => {
      const response = await placeOrder();

      expect(response.body.id).toBeDefined();
    });
  });
  describe('смена статуса долетает клиенту (Шаг 5.5)', () => {
    const placeOrder = async () => {
      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokens.client}`)
        .send({
          restaurantId: ids.brand,
          orderType: OrderType.PICKUP,
          branchId: ids.branch,
          paymentMethod: PaymentMethod.CASH,
          items: [{ menuItemId: ids.item, quantity: 1, optionIds: [] }],
        })
        .expect(201);

      return response.body as { id: string; orderNumber: number };
    };

    const collectEvents = <T>(
      socket: Socket,
      event: string,
      count: number,
    ): Promise<T[]> =>
      new Promise((resolve, reject) => {
        const received: T[] = [];
        const timer = setTimeout(
          () =>
            reject(
              new Error(
                `ждали ${count} событий ${event}, пришло ${received.length}`,
              ),
            ),
          5000,
        );

        socket.on(event, (payload: T) => {
          received.push(payload);
          if (received.length === count) {
            clearTimeout(timer);
            resolve(received);
          }
        });
      });

    const collect = <T>(socket: Socket, event: string): T[] => {
      const received: T[] = [];
      socket.on(event, (payload: T) => received.push(payload));
      return received;
    };

    it('приём заказа: клиенту два статуса, ресторану — обновление списка', async () => {
      const [alice, bob, staff] = await Promise.all([
        connect(WS_NAMESPACES.CLIENT, tokens.client),
        connect(WS_NAMESPACES.CLIENT, tokens.otherClient),
        connect(WS_NAMESPACES.RESTAURANT, tokens.staff),
      ]);

      const order = await placeOrder();

      const onAlice = collectEvents<OrderStatusEvent>(
        alice,
        WS_EVENTS.ORDER_STATUS,
        2,
      );
      const onStaff = collectEvents<OrderUpdatedEvent>(
        staff,
        WS_EVENTS.ORDER_UPDATED,
        2,
      );
      const silentBob = collect<OrderStatusEvent>(bob, WS_EVENTS.ORDER_STATUS);

      await request(app.getHttpServer())
        .patch(`/api/admin/restaurant/orders/${order.id}/accept`)
        .set('Authorization', `Bearer ${tokens.staff}`)
        .send({ prepMinutes: 25 })
        .expect(200);

      const statuses = await onAlice;

      expect(statuses.map((e) => e.status)).toEqual([
        OrderStatus.ACCEPTED,
        OrderStatus.PREPARING,
      ]);
      expect(statuses[0]).toMatchObject({
        orderId: order.id,
        orderNumber: order.orderNumber,
        prepMinutes: 25,
        cancelReason: null,
      });

      const updates = await onStaff;
      expect(updates[1]).toMatchObject({
        orderId: order.id,
        branchId: ids.branch,
        status: OrderStatus.PREPARING,
      });

      expect(silentBob).toEqual([]);
    });

    it('отказ приходит клиенту вместе с причиной', async () => {
      const alice = await connect(WS_NAMESPACES.CLIENT, tokens.client);
      const order = await placeOrder();

      const onAlice = collectEvents<OrderStatusEvent>(
        alice,
        WS_EVENTS.ORDER_STATUS,
        1,
      );

      await request(app.getHttpServer())
        .patch(`/api/admin/restaurant/orders/${order.id}/reject`)
        .set('Authorization', `Bearer ${tokens.staff}`)
        .send({ reason: 'Закончилось тесто' })
        .expect(200);

      const [event] = await onAlice;

      expect(event).toMatchObject({
        orderId: order.id,
        status: OrderStatus.CANCELLED,
        cancelReason: 'Закончилось тесто',
      });
    });

    it('повторное действие не шлёт клиенту второе уведомление', async () => {
      const alice = await connect(WS_NAMESPACES.CLIENT, tokens.client);
      const order = await placeOrder();

      const accept = () =>
        request(app.getHttpServer())
          .patch(`/api/admin/restaurant/orders/${order.id}/accept`)
          .set('Authorization', `Bearer ${tokens.staff}`)
          .send({ prepMinutes: 15 })
          .expect(200);

      const onAlice = collectEvents<OrderStatusEvent>(
        alice,
        WS_EVENTS.ORDER_STATUS,
        2,
      );
      await accept();
      await onAlice;

      const extra = collect<OrderStatusEvent>(alice, WS_EVENTS.ORDER_STATUS);
      await accept();
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(extra).toEqual([]);
    });
  });
});
