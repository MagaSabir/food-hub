import { Prisma } from '@prisma/client';
import {
  amountToFreeDelivery,
  calculateDeliveryFee,
  DeliveryPricing,
} from './delivery-fee';

const d = (v: string | number) => new Prisma.Decimal(v);

const pricing = (over: Partial<DeliveryPricing> = {}): DeliveryPricing => ({
  deliveryBaseFee: d(149),
  deliveryIncludedRadiusKm: d(3),
  deliveryPerKm: d(30),
  deliveryMaxRadiusKm: d(10),
  freeDeliveryMinOrder: null,
  freeDeliveryRadiusKm: null,
  ...over,
});

describe('calculateDeliveryFee', () => {
  it('внутри включённого радиуса — только базовая цена', () => {
    const result = calculateDeliveryFee(pricing(), 2.5, d(1000));
    expect(result).toEqual({ deliverable: true, fee: d(149), isFree: false });
  });

  it('ровно на границе включённого радиуса — ещё базовая цена', () => {
    const result = calculateDeliveryFee(pricing(), 3, d(1000));
    expect(result).toMatchObject({ deliverable: true, fee: d(149) });
  });

  it('сверх включённого радиуса — база + километры × цена за км', () => {
    const result = calculateDeliveryFee(pricing(), 5, d(1000));
    expect(result).toMatchObject({ fee: d(209) });
  });

  it('копейки за километры округляются ВВЕРХ до рубля', () => {
    const result = calculateDeliveryFee(pricing(), 5.37, d(1000));
    expect(result).toMatchObject({ fee: d(221) });
  });

  it('дальше максимального радиуса — не возим', () => {
    expect(calculateDeliveryFee(pricing(), 10.01, d(5000))).toEqual({
      deliverable: false,
    });
  });

  it('ровно на границе максимального радиуса — ещё возим', () => {
    expect(calculateDeliveryFee(pricing(), 10, d(1000))).toMatchObject({
      deliverable: true,
    });
  });

  it('max_radius = null — возим куда угодно', () => {
    const result = calculateDeliveryFee(
      pricing({ deliveryMaxRadiusKm: null }),
      100,
      d(1000),
    );
    expect(result).toMatchObject({ deliverable: true });
  });

  describe('акция «бесплатно от суммы»', () => {
    const promo = pricing({
      freeDeliveryMinOrder: d(1500),
      freeDeliveryRadiusKm: d(5),
    });

    it('сумма набрана и адрес в радиусе акции — бесплатно', () => {
      expect(calculateDeliveryFee(promo, 4, d(1500))).toEqual({
        deliverable: true,
        fee: d(0),
        isFree: true,
      });
    });

    it('сумма набрана, но адрес ДАЛЬШЕ радиуса акции — платно', () => {
      expect(calculateDeliveryFee(promo, 8, d(5000))).toMatchObject({
        isFree: false,
      });
    });

    it('адрес в радиусе, но сумма не набрана — платно', () => {
      expect(calculateDeliveryFee(promo, 4, d(1499))).toMatchObject({
        isFree: false,
      });
    });

    it('акция без географического ограничения действует до max_radius', () => {
      const noGeo = pricing({
        freeDeliveryMinOrder: d(1500),
        freeDeliveryRadiusKm: null,
      });
      expect(calculateDeliveryFee(noGeo, 9.5, d(2000))).toMatchObject({
        isFree: true,
      });
    });

    it('акция НЕ отменяет максимальный радиус', () => {
      expect(calculateDeliveryFee(promo, 12, d(10000))).toEqual({
        deliverable: false,
      });
    });
  });
});

describe('amountToFreeDelivery', () => {
  const promo = pricing({
    freeDeliveryMinOrder: d(1500),
    freeDeliveryRadiusKm: d(5),
  });

  it('показывает, сколько добрать', () => {
    expect(amountToFreeDelivery(promo, 3, d(1200))?.toString()).toBe('300');
  });

  it('уже набрано — 0, а не отрицательное число', () => {
    expect(amountToFreeDelivery(promo, 3, d(2000))?.toString()).toBe('0');
  });

  it('акции нет — null (нечего обещать)', () => {
    expect(amountToFreeDelivery(pricing(), 3, d(100))).toBeNull();
  });

  it('адрес вне радиуса акции — null, а не «доберите»', () => {
    expect(amountToFreeDelivery(promo, 8, d(100))).toBeNull();
  });
  describe('точка возит бесплатно всегда (base_fee = 0)', () => {
    const free = (over: Partial<DeliveryPricing> = {}) =>
      pricing({
        deliveryBaseFee: d(0),
        deliveryPerKm: d(0),
        freeDeliveryMinOrder: d(1500),
        ...over,
      });

    it('добирать не до чего — null, а не «доберите»', () => {
      expect(amountToFreeDelivery(free(), 2, d(600))).toBeNull();
    });

    it('и сама доставка честно считается бесплатной', () => {
      expect(calculateDeliveryFee(free(), 2, d(600))).toEqual({
        deliverable: true,
        fee: d(0),
        isFree: true,
      });
    });

    it('но если за километры всё же берут — обещание снова уместно', () => {
      const paidByKm = free({ deliveryPerKm: d(20) });

      expect(calculateDeliveryFee(paidByKm, 5, d(600))).toMatchObject({
        fee: d(40),
      });
      expect(amountToFreeDelivery(paidByKm, 5, d(600))).toEqual(d(900));
    });
  });
});
