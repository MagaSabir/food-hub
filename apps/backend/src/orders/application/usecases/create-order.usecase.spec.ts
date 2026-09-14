import {
  ErrorCodes,
  OrderBlockReason,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from '@foodhubme/shared';
import { Prisma } from '@prisma/client';
import { OrderContext } from '../../domain/rules/order-calculation';
import { OrderableItem } from '../../domain/rules/order-lines';
import { OrderableBranch } from '../../domain/rules/order-placement';
import {
  NewOrder,
  OrdersRepository,
  OrderWithDetails,
} from '../../infrastructure/repositories/orders.repository';
import { CreateOrderDto } from '../dto/create-order.application.dto';
import { CreateOrderCommand, CreateOrderUseCase } from './create-order.usecase';

const d = (v: string | number) => new Prisma.Decimal(v);

const NOW_OPEN = new Date('2026-08-14T11:00:00Z');

const ALWAYS_OPEN = {
  mon: [{ from: '00:00', to: '23:59' }],
  tue: [{ from: '00:00', to: '23:59' }],
  wed: [{ from: '00:00', to: '23:59' }],
  thu: [{ from: '00:00', to: '23:59' }],
  fri: [{ from: '00:00', to: '23:59' }],
  sat: [{ from: '00:00', to: '23:59' }],
  sun: [{ from: '00:00', to: '23:59' }],
};

const USER_ID = '11111111-1111-4111-8111-111111111111';
const BRAND_ID = '22222222-2222-4222-8222-222222222222';
const ITEM_ID = '33333333-3333-4333-8333-333333333333';

const branch = (over: Partial<OrderableBranch> = {}): OrderableBranch => ({
  id: 'b1',
  address: 'пр. Путина, 1',
  latitude: 43.3178,
  longitude: 45.6949,
  workingHours: ALWAYS_OPEN,
  isActive: true,
  acceptingOrders: true,
  hasDelivery: true,
  hasPickup: true,
  hasDineIn: true,
  minOrderAmount: d(0),
  deliveryBaseFee: d(149),
  deliveryIncludedRadiusKm: d(3),
  deliveryPerKm: d(30),
  deliveryMaxRadiusKm: d(10),
  freeDeliveryMinOrder: null,
  freeDeliveryRadiusKm: null,
  ...over,
});

const item = (over: Partial<OrderableItem> = {}): OrderableItem => ({
  id: ITEM_ID,
  name: 'Пицца Маргарита',
  photos: ['https://cdn.local/margarita.jpg'],
  price: d(500),
  discountPrice: null,
  discountUntil: null,
  isAvailable: true,
  modifierGroups: [],
  ...over,
});

const NEAR = {
  address: 'пр. Путина, 12',
  details: null,
  latitude: 43.3268,
  longitude: 45.6949,
};

const dto = (over: Partial<CreateOrderDto> = {}): CreateOrderDto => ({
  userId: USER_ID,
  restaurantId: BRAND_ID,
  branchId: null,
  orderType: OrderType.DELIVERY,
  paymentMethod: PaymentMethod.CASH,
  items: [{ menuItemId: ITEM_ID, quantity: 2, optionIds: [] }],
  delivery: NEAR,
  contactPhone: null,
  comment: null,
  ...over,
});

const savedRow = (order: NewOrder): OrderWithDetails => ({
  id: 'order-1',
  orderNumber: 1043,
  branchId: order.branchId,
  restaurantId: order.restaurantId,
  userId: order.userId,
  orderType: order.orderType,
  status: OrderStatus.PENDING,
  cancelReason: null,
  deliveryAddress: order.delivery?.address ?? null,
  deliveryDetails: order.delivery?.details ?? null,
  deliveryLat: order.delivery?.latitude ?? null,
  deliveryLng: order.delivery?.longitude ?? null,
  distanceKm: order.delivery?.distanceKm ?? null,
  deliveryEtaMin: null,
  contactPhone: order.contactPhone,
  comment: order.comment,
  itemsTotal: order.itemsTotal,
  deliveryFee: order.deliveryFee,
  discountAmount: d(0),
  total: order.total,
  paymentMethod: order.paymentMethod,
  paymentStatus: PaymentStatus.PENDING,
  prepMinutes: null,
  acceptedAt: null,
  dispatchedAt: null,
  completedAt: null,
  createdAt: NOW_OPEN,
  updatedAt: NOW_OPEN,
  restaurant: { name: 'Сыроварня' },
  branch: { address: 'пр. Путина, 1' },
  items: order.lines.map((line, index) => ({
    id: `item-${index}`,
    orderId: 'order-1',
    menuItemId: line.menuItemId,
    nameSnapshot: line.nameSnapshot,
    photoSnapshot: line.photoSnapshot,
    basePriceSnapshot: line.basePriceSnapshot,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
    modifiers: line.modifiers.map((modifier, i) => ({
      id: `mod-${index}-${i}`,
      orderItemId: `item-${index}`,
      ...modifier,
    })),
  })),
});

describe('CreateOrderUseCase', () => {
  let repo: {
    findOrderContext: jest.Mock;
    findClient: jest.Mock;
    createOrder: jest.Mock;
  };
  let usecase: CreateOrderUseCase;

  const context = (over: Partial<OrderContext> = {}): OrderContext => ({
    restaurant: { id: BRAND_ID, name: 'Сыроварня' },
    branches: [branch()],
    items: [item()],
    ...over,
  });

  const saved = (): NewOrder =>
    (repo.createOrder.mock.calls as NewOrder[][])[0][0];

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick'] }).setSystemTime(NOW_OPEN);

    repo = {
      findOrderContext: jest.fn().mockResolvedValue(context()),
      findClient: jest
        .fn()
        .mockResolvedValue({ id: USER_ID, phone: '+79280000001' }),
      createOrder: jest
        .fn()
        .mockImplementation((order: NewOrder) =>
          Promise.resolve(savedRow(order)),
        ),
    };
    usecase = new CreateOrderUseCase(repo as unknown as OrdersRepository);
  });

  afterEach(() => jest.useRealTimers());

  const run = (over: Partial<CreateOrderDto> = {}) =>
    usecase.execute(new CreateOrderCommand(dto(over)));

  type Refusal = Error & { code: string; blockReason?: OrderBlockReason };

  const failure = async (
    over: Partial<CreateOrderDto> = {},
  ): Promise<Refusal> => {
    try {
      await run(over);
    } catch (error) {
      return error as Refusal;
    }
    throw new Error('ожидался отказ, но заказ создался');
  };

  describe('доставка', () => {
    it('создаёт заказ: точку выбрал сервер, суммы посчитал backend', async () => {
      const view = await run();

      expect(saved().branchId).toBe('b1');
      expect(saved().itemsTotal.toString()).toBe('1000');
      expect(saved().deliveryFee.toString()).toBe('149');
      expect(saved().total.toString()).toBe('1149');
      expect(view.total).toBe(1149);
      expect(view.status).toBe(OrderStatus.PENDING);
      expect(view.orderNumber).toBe(1043);
    });

    it('в заказ уходят СНИМКИ позиции, а не ссылка на меню', async () => {
      const view = await run();

      expect(saved().lines).toEqual([
        expect.objectContaining({
          menuItemId: ITEM_ID,
          nameSnapshot: 'Пицца Маргарита',
          quantity: 2,
        }),
      ]);
      expect(view.items[0].name).toBe('Пицца Маргарита');
      expect(saved().lines[0].photoSnapshot).toBe(
        'https://cdn.local/margarita.jpg',
      );
      expect(view.items[0].photoUrl).toBe('https://cdn.local/margarita.jpg');
      expect(view.items[0].basePrice).toBe(500);
      expect(view.items[0].lineTotal).toBe(1000);
    });

    it('адрес и расстояние ложатся в заказ; расстояние — Decimal(6,2)', async () => {
      await run();

      expect(saved().delivery?.address).toBe(NEAR.address);
      expect(saved().delivery?.distanceKm.decimalPlaces()).toBeLessThanOrEqual(
        2,
      );
    });

    it('цена берётся со скидкой, действующей В МОМЕНТ оформления', async () => {
      repo.findOrderContext.mockResolvedValue(
        context({
          items: [item({ discountPrice: d(400), discountUntil: null })],
        }),
      );

      await run();
      expect(saved().itemsTotal.toString()).toBe('800');
    });
  });

  describe('самовывоз и зал', () => {
    it('PICKUP: точка — та, что назвал клиент; доставка не считается', async () => {
      const view = await run({
        orderType: OrderType.PICKUP,
        branchId: 'b1',
        delivery: null,
      });

      expect(saved().branchId).toBe('b1');
      expect(saved().delivery).toBeNull();
      expect(saved().deliveryFee.toString()).toBe('0');
      expect(view.deliveryAddress).toBeNull();
      expect(view.distanceKm).toBeNull();
    });

    it('DINE_IN: заказ создаётся без адреса', async () => {
      const view = await run({
        orderType: OrderType.DINE_IN,
        branchId: 'b1',
        delivery: null,
      });

      expect(view.orderType).toBe(OrderType.DINE_IN);
      expect(saved().delivery).toBeNull();
    });

    it('чужая точка (её нет у бренда) → отказ, заказ не создан', async () => {
      const error = await failure({
        orderType: OrderType.PICKUP,
        branchId: 'foreign',
        delivery: null,
      });

      expect(error.code).toBe(ErrorCodes.ORDER_NOT_AVAILABLE);
      expect(error.blockReason).toBe(OrderBlockReason.NO_BRANCH);
      expect(repo.createOrder).not.toHaveBeenCalled();
    });
  });

  describe('телефон для связи', () => {
    it('не прислали — берём подтверждённый номер профиля', async () => {
      await run();
      expect(saved().contactPhone).toBe('+79280000001');
    });

    it('прислали другой — пишем его («звоните мужу, я за рулём»)', async () => {
      await run({ contactPhone: '+79280000009' });
      expect(saved().contactPhone).toBe('+79280000009');
    });
  });

  describe('когда заказ создавать нельзя', () => {
    it('точка закрыта → ORDER_NOT_AVAILABLE, а не заказ в пустоту', async () => {
      const night = {
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
        sun: [],
      };
      repo.findOrderContext.mockResolvedValue(
        context({ branches: [branch({ workingHours: night })] }),
      );

      const error = await failure();

      expect(error.blockReason).toBe(OrderBlockReason.CLOSED);
      expect(repo.createOrder).not.toHaveBeenCalled();
    });

    it('не набрана минимальная сумма → в сообщении сказано, сколько добрать', async () => {
      repo.findOrderContext.mockResolvedValue(
        context({ branches: [branch({ minOrderAmount: d(1500) })] }),
      );

      const error = await failure();

      expect(error.blockReason).toBe(OrderBlockReason.MIN_ORDER);
      expect(error.message).toContain('доберите 500 ₽');
    });

    it('адрес вне зоны доставки → отказ с расстоянием', async () => {
      const error = await failure({ delivery: { ...NEAR, latitude: 43.68 } });

      expect(error.blockReason).toBe(OrderBlockReason.TOO_FAR);
      expect(error.message).toContain('км');
    });

    it('онлайн-оплата пока не подключена → отказ ДО похода в базу', async () => {
      const error = await failure({ paymentMethod: PaymentMethod.ONLINE });

      expect(error.code).toBe(ErrorCodes.PAYMENT_METHOD_UNAVAILABLE);
      expect(repo.findOrderContext).not.toHaveBeenCalled();
    });

    it('аккаунт удалён, а токен ещё жив → просим войти заново', async () => {
      repo.findClient.mockResolvedValue(null);

      const error = await failure();

      expect(error.code).toBe(ErrorCodes.INVALID_ACCESS_TOKEN);
      expect(repo.createOrder).not.toHaveBeenCalled();
    });

    it('блюдо в стоп-листе → ошибка корзины, заказ не создан', async () => {
      repo.findOrderContext.mockResolvedValue(
        context({ items: [item({ isAvailable: false })] }),
      );

      const error = await failure();

      expect(error.code).toBe(ErrorCodes.MENU_ITEM_UNAVAILABLE);
      expect(repo.createOrder).not.toHaveBeenCalled();
    });
  });

  it('владелец заказа — из токена, а не из тела запроса', async () => {
    await run();
    expect(saved().userId).toBe(USER_ID);
    expect(repo.findClient).toHaveBeenCalledWith(USER_ID);
  });
});
