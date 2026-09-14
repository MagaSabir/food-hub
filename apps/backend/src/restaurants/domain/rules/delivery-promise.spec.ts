import {
  deliveryPromise,
  type DeliveryPromiseBranch,
} from './delivery-promise';

const branch = (
  over: Partial<DeliveryPromiseBranch> = {},
): DeliveryPromiseBranch => ({
  hasDelivery: true,
  deliveryBaseFee: 149,
  freeDeliveryMinOrder: 1500,
  ...over,
});

describe('deliveryPromise', () => {
  it('«от» — это МИНИМУМ по точкам, а не первая попавшаяся', () => {
    const promise = deliveryPromise([
      branch({ deliveryBaseFee: 199, freeDeliveryMinOrder: 2000 }),
      branch({ deliveryBaseFee: 99, freeDeliveryMinOrder: 1000 }),
    ]);

    expect(promise).toEqual({ deliveryFeeFrom: 99, freeDeliveryFrom: 1000 });
  });

  it('точки, которые не возят, в обещании не участвуют', () => {
    const promise = deliveryPromise([
      branch({ hasDelivery: false, deliveryBaseFee: 0 }),
      branch({ deliveryBaseFee: 149 }),
    ]);

    expect(promise.deliveryFeeFrom).toBe(149);
  });

  it('бренд без доставки — оба поля null (остаётся самовывоз)', () => {
    const promise = deliveryPromise([branch({ hasDelivery: false })]);

    expect(promise).toEqual({ deliveryFeeFrom: null, freeDeliveryFrom: null });
  });

  it('бесплатная доставка у всех точек — «от 0 ₽», а не отсутствие цены', () => {
    const promise = deliveryPromise([branch({ deliveryBaseFee: 0 })]);

    expect(promise.deliveryFeeFrom).toBe(0);
  });

  it('акции нет ни у кого → freeDeliveryFrom null, но цена доставки есть', () => {
    const promise = deliveryPromise([
      branch({ freeDeliveryMinOrder: null }),
      branch({ freeDeliveryMinOrder: null, deliveryBaseFee: 200 }),
    ]);

    expect(promise).toEqual({ deliveryFeeFrom: 149, freeDeliveryFrom: null });
  });

  it('акция хотя бы у одной точки — берём её порог', () => {
    const promise = deliveryPromise([
      branch({ freeDeliveryMinOrder: null }),
      branch({ freeDeliveryMinOrder: 800 }),
    ]);

    expect(promise.freeDeliveryFrom).toBe(800);
  });

  it('точек нет вовсе — не падаем (бренд без активных точек в каталог не попадёт)', () => {
    expect(deliveryPromise([])).toEqual({
      deliveryFeeFrom: null,
      freeDeliveryFrom: null,
    });
  });
});
