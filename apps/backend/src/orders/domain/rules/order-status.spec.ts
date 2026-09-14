import { OrderStatus, OrderType } from '@foodhubme/shared';
import {
  canTransition,
  hasReached,
  isFinalStatus,
  nextStatus,
} from './order-status';

describe('машина статусов заказа', () => {
  describe('маршрут доставки', () => {
    const can = (from: OrderStatus, to: OrderStatus) =>
      canTransition(OrderType.DELIVERY, from, to);

    it('идёт по шагам до конца', () => {
      expect(can(OrderStatus.PENDING, OrderStatus.ACCEPTED)).toBe(true);
      expect(can(OrderStatus.ACCEPTED, OrderStatus.PREPARING)).toBe(true);
      expect(can(OrderStatus.PREPARING, OrderStatus.ON_THE_WAY)).toBe(true);
      expect(can(OrderStatus.ON_THE_WAY, OrderStatus.COMPLETED)).toBe(true);
    });

    it('READY у доставки не бывает — курьер везёт, а не выдаёт', () => {
      expect(can(OrderStatus.PREPARING, OrderStatus.READY)).toBe(false);
    });

    it('через шаг нельзя: «принят» сразу «в пути»', () => {
      expect(can(OrderStatus.ACCEPTED, OrderStatus.ON_THE_WAY)).toBe(false);
    });

    it('назад нельзя: «в пути» обратно «готовится»', () => {
      expect(can(OrderStatus.ON_THE_WAY, OrderStatus.PREPARING)).toBe(false);
    });

    it('в тот же статус нельзя — это не переход', () => {
      expect(can(OrderStatus.PREPARING, OrderStatus.PREPARING)).toBe(false);
    });
  });

  describe('маршрут самовывоза и зала', () => {
    it.each([OrderType.PICKUP, OrderType.DINE_IN])(
      '%s: после готовки заказ становится READY',
      (type) => {
        expect(
          canTransition(type, OrderStatus.PREPARING, OrderStatus.READY),
        ).toBe(true);
        expect(
          canTransition(type, OrderStatus.READY, OrderStatus.COMPLETED),
        ).toBe(true);
      },
    );

    it('ON_THE_WAY у самовывоза не бывает — везти некому', () => {
      expect(
        canTransition(
          OrderType.PICKUP,
          OrderStatus.PREPARING,
          OrderStatus.ON_THE_WAY,
        ),
      ).toBe(false);
    });
  });

  describe('отмена', () => {
    it.each([
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.ON_THE_WAY,
    ])('обрывает маршрут из %s', (from) => {
      expect(
        canTransition(OrderType.DELIVERY, from, OrderStatus.CANCELLED),
      ).toBe(true);
    });

    it('но не после завершения: еда съедена, деньги взяты', () => {
      expect(
        canTransition(
          OrderType.DELIVERY,
          OrderStatus.COMPLETED,
          OrderStatus.CANCELLED,
        ),
      ).toBe(false);
    });

    it('и не дважды', () => {
      expect(
        canTransition(
          OrderType.DELIVERY,
          OrderStatus.CANCELLED,
          OrderStatus.CANCELLED,
        ),
      ).toBe(false);
    });
  });

  it('доигранный заказ не двигается вообще', () => {
    expect(isFinalStatus(OrderStatus.COMPLETED)).toBe(true);
    expect(isFinalStatus(OrderStatus.CANCELLED)).toBe(true);
    expect(isFinalStatus(OrderStatus.PENDING)).toBe(false);

    expect(
      canTransition(
        OrderType.DELIVERY,
        OrderStatus.COMPLETED,
        OrderStatus.PREPARING,
      ),
    ).toBe(false);
  });

  describe('nextStatus', () => {
    it('знает, что идёт следом на каждом маршруте', () => {
      expect(nextStatus(OrderType.DELIVERY, OrderStatus.PREPARING)).toBe(
        OrderStatus.ON_THE_WAY,
      );
      expect(nextStatus(OrderType.PICKUP, OrderStatus.PREPARING)).toBe(
        OrderStatus.READY,
      );
    });

    it('в конце маршрута и после отмены — некуда', () => {
      expect(nextStatus(OrderType.DELIVERY, OrderStatus.COMPLETED)).toBeNull();
      expect(nextStatus(OrderType.DELIVERY, OrderStatus.CANCELLED)).toBeNull();
    });
  });
});

describe('hasReached — «о чём просили, уже сделано»', () => {
  const reached = (current: OrderStatus, target: OrderStatus) =>
    hasReached(OrderType.DELIVERY, current, target);

  it('тот же статус — очевидно, сделано', () => {
    expect(reached(OrderStatus.ACCEPTED, OrderStatus.ACCEPTED)).toBe(true);
  });

  it('заказ ушёл ДАЛЬШЕ по маршруту — просьба всё равно выполнена', () => {
    expect(reached(OrderStatus.PREPARING, OrderStatus.ACCEPTED)).toBe(true);
    expect(reached(OrderStatus.COMPLETED, OrderStatus.ON_THE_WAY)).toBe(true);
  });

  it('заказ ещё НЕ дошёл — не сделано', () => {
    expect(reached(OrderStatus.PENDING, OrderStatus.ACCEPTED)).toBe(false);
    expect(reached(OrderStatus.ACCEPTED, OrderStatus.COMPLETED)).toBe(false);
  });

  it('отмена не «проходится» маршрутом ни в одну сторону', () => {
    expect(reached(OrderStatus.CANCELLED, OrderStatus.ACCEPTED)).toBe(false);
    expect(reached(OrderStatus.COMPLETED, OrderStatus.CANCELLED)).toBe(false);
    expect(reached(OrderStatus.CANCELLED, OrderStatus.CANCELLED)).toBe(true);
  });

  it('статус не с этого маршрута не считается пройденным', () => {
    expect(reached(OrderStatus.COMPLETED, OrderStatus.READY)).toBe(false);
  });
});
