import { deliveryReach, type ReachBranch } from './delivery-reach';

const HOME = { latitude: 43.3169, longitude: 45.6981 };

const NEAR = { latitude: 43.3349, longitude: 45.6981 };
const FAR = { latitude: 43.4159, longitude: 45.6981 };

const branch = (over: Partial<ReachBranch> = {}): ReachBranch => ({
  ...NEAR,
  hasDelivery: true,
  deliveryMaxRadiusKm: 5,
  ...over,
});

describe('deliveryReach', () => {
  describe('возит ли сюда', () => {
    it('точка в радиусе → возит', () => {
      const reach = deliveryReach([branch()], HOME);

      expect(reach.deliversToAddress).toBe(true);
    });

    it('точка дальше своего радиуса → не возит', () => {
      const reach = deliveryReach([branch({ ...FAR })], HOME);

      expect(reach.deliversToAddress).toBe(false);
    });

    it('радиус не задан → возит куда угодно', () => {
      const reach = deliveryReach(
        [branch({ ...FAR, deliveryMaxRadiusKm: null })],
        HOME,
      );

      expect(reach.deliversToAddress).toBe(true);
    });

    it('точка не возит вовсе (только самовывоз) → не возит', () => {
      const reach = deliveryReach([branch({ hasDelivery: false })], HOME);

      expect(reach.deliversToAddress).toBe(false);
    });

    it('достаточно ОДНОЙ достающей точки из нескольких', () => {
      const reach = deliveryReach(
        [branch({ ...FAR }), branch({ ...NEAR })],
        HOME,
      );

      expect(reach.deliversToAddress).toBe(true);
    });
  });

  describe('расстояние', () => {
    it('до БЛИЖАЙШЕЙ точки, а не до первой в списке', () => {
      const reach = deliveryReach(
        [branch({ ...FAR }), branch({ ...NEAR })],
        HOME,
      );

      expect(reach.distanceKm).toBeCloseTo(2, 0);
    });

    it('считается и у бренда без доставки — «далеко ли ехать самому»', () => {
      const reach = deliveryReach([branch({ hasDelivery: false })], HOME);

      expect(reach.deliversToAddress).toBe(false);
      expect(reach.distanceKm).toBeCloseTo(2, 0);
    });
  });

  describe('считать не из чего', () => {
    it('точек нет вовсе', () => {
      expect(deliveryReach([], HOME)).toEqual({
        deliversToAddress: false,
        distanceKm: null,
      });
    });

    it('у точек нет координат → в расчёте не участвуют', () => {
      const reach = deliveryReach(
        [branch({ latitude: null, longitude: null })],
        HOME,
      );

      expect(reach).toEqual({ deliversToAddress: false, distanceKm: null });
    });

    it('точка без координат не мешает точке с координатами', () => {
      const reach = deliveryReach(
        [branch({ latitude: null, longitude: null }), branch()],
        HOME,
      );

      expect(reach.deliversToAddress).toBe(true);
      expect(reach.distanceKm).not.toBeNull();
    });
  });
});
