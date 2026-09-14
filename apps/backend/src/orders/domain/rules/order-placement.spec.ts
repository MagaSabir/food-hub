import { OrderBlockReason, OrderType } from '@foodhubme/shared';
import { Prisma } from '@prisma/client';
import { RESTAURANT_TIMEZONE } from '../../../restaurants/domain/policies/catalog.policy';
import { OrderableBranch, resolveOrderPlacement } from './order-placement';

const d = (v: string | number) => new Prisma.Decimal(v);

const NOW = new Date('2026-08-14T11:00:00Z');
const ALWAYS_OPEN = {
  mon: [{ from: '00:00', to: '23:59' }],
  tue: [{ from: '00:00', to: '23:59' }],
  wed: [{ from: '00:00', to: '23:59' }],
  thu: [{ from: '00:00', to: '23:59' }],
  fri: [{ from: '00:00', to: '23:59' }],
  sat: [{ from: '00:00', to: '23:59' }],
  sun: [{ from: '00:00', to: '23:59' }],
};

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

const NEAR_POINT = { latitude: 43.3268, longitude: 45.6949 };
const FAR_POINT = { latitude: 43.68, longitude: 45.6949 };

const place = (over: Partial<Parameters<typeof resolveOrderPlacement>[0]>) =>
  resolveOrderPlacement({
    branches: [branch()],
    orderType: OrderType.DELIVERY,
    destination: NEAR_POINT,
    requestedBranchId: null,
    itemsTotal: d(1000),
    now: NOW,
    timeZone: RESTAURANT_TIMEZONE,
    ...over,
  });

describe('resolveOrderPlacement', () => {
  describe('доставка', () => {
    it('точку выбирает сервер, цена доставки посчитана', () => {
      const result = place({});
      expect(result.canOrder).toBe(true);
      expect(result.branch?.id).toBe('b1');
      expect(result.distanceKm).toBeGreaterThan(0);
      expect(result.deliveryFee.toString()).toBe('149');
    });

    it('из двух точек берётся БЛИЖАЙШАЯ', () => {
      const far = branch({ id: 'far', latitude: 43.36, longitude: 45.6949 });
      const near = branch({ id: 'near' });
      expect(place({ branches: [far, near] }).branch?.id).toBe('near');
    });

    it('адрес вне зоны — TOO_FAR, но расстояние показываем', () => {
      const result = place({ destination: FAR_POINT });
      expect(result.blockReason).toBe(OrderBlockReason.TOO_FAR);
      expect(result.distanceKm).toBeGreaterThan(10);
    });

    it('ближайшая закрыта, дальняя открыта → берём дальнюю открытую', () => {
      const closed = branch({ id: 'closed', workingHours: {} });
      const open = branch({ id: 'open', latitude: 43.34, longitude: 45.6949 });
      const result = place({ branches: [closed, open] });
      expect(result.canOrder).toBe(true);
      expect(result.branch?.id).toBe('open');
    });

    it('все точки закрыты — CLOSED', () => {
      const result = place({ branches: [branch({ workingHours: {} })] });
      expect(result.blockReason).toBe(OrderBlockReason.CLOSED);
    });

    it('открыта, но приём выключен вручную — NOT_ACCEPTING', () => {
      const result = place({ branches: [branch({ acceptingOrders: false })] });
      expect(result.blockReason).toBe(OrderBlockReason.NOT_ACCEPTING);
    });

    it('ни одна точка не возит — TYPE_UNAVAILABLE, а не «далеко»', () => {
      const result = place({ branches: [branch({ hasDelivery: false })] });
      expect(result.blockReason).toBe(OrderBlockReason.TYPE_UNAVAILABLE);
    });

    it('точка без координат в доставке не участвует', () => {
      const result = place({
        branches: [branch({ latitude: null, longitude: null })],
      });
      expect(result.canOrder).toBe(false);
    });

    it('акция «бесплатно от суммы» применяется через общий расчёт', () => {
      const promo = branch({
        freeDeliveryMinOrder: d(1500),
        freeDeliveryRadiusKm: d(5),
      });
      const result = place({ branches: [promo], itemsTotal: d(1500) });
      expect(result.deliveryFee.toString()).toBe('0');
    });
  });

  describe('самовывоз и зал', () => {
    it('берётся точка, которую назвал клиент', () => {
      const result = place({
        orderType: OrderType.PICKUP,
        requestedBranchId: 'b1',
        destination: null,
      });
      expect(result.canOrder).toBe(true);
      expect(result.branch?.id).toBe('b1');
    });

    it('доставка не считается: fee 0 и расстояния нет', () => {
      const result = place({
        orderType: OrderType.PICKUP,
        requestedBranchId: 'b1',
        destination: null,
      });
      expect(result.deliveryFee.toString()).toBe('0');
      expect(result.distanceKm).toBeNull();
    });

    it('чужая или несуществующая точка — NO_BRANCH', () => {
      const result = place({
        orderType: OrderType.PICKUP,
        requestedBranchId: 'чужая',
        destination: null,
      });
      expect(result.blockReason).toBe(OrderBlockReason.NO_BRANCH);
    });

    it('точка не работает в зале — TYPE_UNAVAILABLE', () => {
      const result = place({
        branches: [branch({ hasDineIn: false })],
        orderType: OrderType.DINE_IN,
        requestedBranchId: 'b1',
        destination: null,
      });
      expect(result.blockReason).toBe(OrderBlockReason.TYPE_UNAVAILABLE);
    });

    it('точку клиента НЕ подменяем на другую, даже если рядом есть живая', () => {
      const chosen = branch({ id: 'chosen', hasPickup: false });
      const other = branch({ id: 'other' });
      const result = place({
        branches: [chosen, other],
        orderType: OrderType.PICKUP,
        requestedBranchId: 'chosen',
        destination: null,
      });
      expect(result.blockReason).toBe(OrderBlockReason.TYPE_UNAVAILABLE);
      expect(result.branch?.id).toBe('chosen');
    });
  });

  describe('минимальная сумма', () => {
    it('не набрана — MIN_ORDER (проверяется ПОСЛЕДНЕЙ)', () => {
      const result = place({
        branches: [branch({ minOrderAmount: d(500) })],
        itemsTotal: d(499),
      });
      expect(result.blockReason).toBe(OrderBlockReason.MIN_ORDER);
      expect(result.branch?.id).toBe('b1');
    });

    it('ровно минимум — можно заказывать', () => {
      const result = place({
        branches: [branch({ minOrderAmount: d(500) })],
        itemsTotal: d(500),
      });
      expect(result.canOrder).toBe(true);
    });

    it('«далеко» важнее «доберите сумму»', () => {
      const result = place({
        branches: [branch({ minOrderAmount: d(5000) })],
        destination: FAR_POINT,
        itemsTotal: d(100),
      });
      expect(result.blockReason).toBe(OrderBlockReason.TOO_FAR);
    });

    it('сумма сравнивается БЕЗ доставки', () => {
      const result = place({
        branches: [branch({ minOrderAmount: d(500) })],
        itemsTotal: d(400),
      });
      expect(result.blockReason).toBe(OrderBlockReason.MIN_ORDER);
    });
  });
});
