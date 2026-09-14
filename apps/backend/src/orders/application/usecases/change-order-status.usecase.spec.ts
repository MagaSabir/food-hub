import { ErrorCodes, OrderStatus, OrderType } from '@foodhubme/shared';
import { EventBus } from '@nestjs/cqrs';
import { OrderViewDto } from '../../api/view-dto/order.view-dto';
import {
  OrdersRepository,
  StatusChange,
} from '../../infrastructure/repositories/orders.repository';
import { ChangeOrderStatusDto } from '../dto/change-order-status.application.dto';
import { OrderStatusChangedEvent } from '../events/order-status-changed.event';
import {
  ChangeOrderStatusCommand,
  ChangeOrderStatusUseCase,
} from './change-order-status.usecase';

describe('ChangeOrderStatusUseCase', () => {
  const SCOPE = { restaurantId: 'brand-1', branchId: 'branch-7' };
  const STAFF = 'staff-42';
  const ORDER_ID = 'order-1';

  let status: OrderStatus;
  let orderType: OrderType;
  let visible: boolean;

  let repo: {
    findForStatusChange: jest.Mock;
    changeStatus: jest.Mock;
    findCardForStaff: jest.Mock;
  };
  let events: { publish: jest.Mock };
  let usecase: ChangeOrderStatusUseCase;

  beforeEach(() => {
    status = OrderStatus.PENDING;
    orderType = OrderType.DELIVERY;
    visible = true;

    repo = {
      findForStatusChange: jest.fn(() =>
        Promise.resolve(visible ? { id: ORDER_ID, status, orderType } : null),
      ),

      changeStatus: jest.fn((input: StatusChange) => {
        if (input.expectedFrom !== status) return Promise.resolve(null);
        status = input.status;
        return Promise.resolve(row());
      }),

      findCardForStaff: jest.fn(() => Promise.resolve(visible ? {} : null)),
    };

    jest
      .spyOn(OrderViewDto, 'mapToView')
      .mockReturnValue({} as unknown as OrderViewDto);

    events = { publish: jest.fn() };
    usecase = new ChangeOrderStatusUseCase(
      repo as unknown as OrdersRepository,
      events as unknown as EventBus,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  const run = (action: ChangeOrderStatusDto['action']) =>
    usecase.execute(
      new ChangeOrderStatusCommand({
        scope: SCOPE,
        staffUserId: STAFF,
        orderId: ORDER_ID,
        action,
      }),
    );

  function row() {
    return {
      id: ORDER_ID,
      orderNumber: 1043,
      status,
      userId: 'alice',
      restaurantId: SCOPE.restaurantId,
      branchId: SCOPE.branchId,
      prepMinutes: 25,
      cancelReason: null,
    };
  }

  const published = (): OrderStatusChangedEvent[] =>
    (events.publish.mock.calls as [OrderStatusChangedEvent][]).map(
      ([event]) => event,
    );

  const writes = (): StatusChange[] =>
    (repo.changeStatus.mock.calls as [StatusChange][]).map(([call]) => call);

  const failure = async (
    action: ChangeOrderStatusDto['action'],
  ): Promise<Error & { code: string }> => {
    try {
      await run(action);
    } catch (error) {
      return error as Error & { code: string };
    }
    throw new Error('ожидался отказ, но статус сменился');
  };

  const accept = () => run({ status: OrderStatus.ACCEPTED, prepMinutes: 25 });

  describe('приём заказа', () => {
    it('пишет ACCEPTED от сотрудника и сразу PREPARING от системы', async () => {
      await accept();

      expect(writes()).toEqual([
        {
          orderId: ORDER_ID,
          scope: SCOPE,
          expectedFrom: OrderStatus.PENDING,
          status: OrderStatus.ACCEPTED,
          changedBy: `staff:${STAFF}`,
          prepMinutes: 25,
        },
        {
          orderId: ORDER_ID,
          scope: SCOPE,
          expectedFrom: OrderStatus.ACCEPTED,
          status: OrderStatus.PREPARING,
          changedBy: 'system',
        },
      ]);
      expect(status).toBe(OrderStatus.PREPARING);
    });

    it('повторное «Принять» ничего не пишет и не падает', async () => {
      await accept();
      repo.changeStatus.mockClear();

      await expect(accept()).resolves.toBeDefined();

      expect(writes()).toEqual([]);
      expect(status).toBe(OrderStatus.PREPARING);
    });

    it('если заказ отменили в ту же секунду, приём всё равно успешен', async () => {
      repo.changeStatus
        .mockImplementationOnce((input: StatusChange) => {
          status = input.status;
          return Promise.resolve({});
        })
        .mockImplementationOnce(() => {
          status = OrderStatus.CANCELLED;
          return Promise.resolve(null);
        });

      await expect(accept()).resolves.toBeDefined();
    });
  });

  describe('гонка двух сотрудников', () => {
    it('проигравший получает заказ, а не ошибку: сделано то же самое', async () => {
      repo.changeStatus.mockImplementationOnce(() => {
        status = OrderStatus.PREPARING;
        return Promise.resolve(null);
      });

      await expect(accept()).resolves.toBeDefined();
      expect(repo.findCardForStaff).toHaveBeenCalled();
    });

    it('но если коллега сделал ДРУГОЕ — это конфликт', async () => {
      status = OrderStatus.PREPARING;
      repo.changeStatus.mockImplementationOnce(() => {
        status = OrderStatus.CANCELLED;
        return Promise.resolve(null);
      });

      const error = await failure({ status: OrderStatus.ON_THE_WAY });

      expect(error.code).toBe(ErrorCodes.ORDER_STATUS_CONFLICT);
    });
  });

  describe('остальные действия', () => {
    it('отказ: причина уходит в запись, авто-перехода после него нет', async () => {
      status = OrderStatus.PREPARING;

      await run({
        status: OrderStatus.CANCELLED,
        cancelReason: 'кончилось тесто',
      });

      expect(writes()).toEqual([
        {
          orderId: ORDER_ID,
          scope: SCOPE,
          expectedFrom: OrderStatus.PREPARING,
          status: OrderStatus.CANCELLED,
          changedBy: `staff:${STAFF}`,
          cancelReason: 'кончилось тесто',
        },
      ]);
    });

    it('следующий шаг маршрута доставки', async () => {
      status = OrderStatus.PREPARING;

      await run({ status: OrderStatus.ON_THE_WAY });

      expect(status).toBe(OrderStatus.ON_THE_WAY);
    });

    it('перескок через шаг → конфликт, до базы не доходит', async () => {
      const error = await failure({ status: OrderStatus.COMPLETED });

      expect(error.code).toBe(ErrorCodes.ORDER_STATUS_CONFLICT);
      expect(writes()).toEqual([]);
    });

    it('доставленный заказ отменить нельзя', async () => {
      status = OrderStatus.COMPLETED;

      const error = await failure({
        status: OrderStatus.CANCELLED,
        cancelReason: 'передумали',
      });

      expect(error.code).toBe(ErrorCodes.ORDER_STATUS_CONFLICT);
      expect(writes()).toEqual([]);
    });

    it('READY у доставки не существует — курьер везёт, а не выдаёт', async () => {
      status = OrderStatus.PREPARING;

      const error = await failure({ status: OrderStatus.READY });

      expect(error.code).toBe(ErrorCodes.ORDER_STATUS_CONFLICT);
    });

    it('самовывоз доходит до READY', async () => {
      orderType = OrderType.PICKUP;
      status = OrderStatus.PREPARING;

      await run({ status: OrderStatus.READY });

      expect(status).toBe(OrderStatus.READY);
    });
  });

  describe('чужое и несуществующее', () => {
    it('→ ORDER_NOT_FOUND, один ответ на оба случая', async () => {
      visible = false;

      const error = await failure({
        status: OrderStatus.ACCEPTED,
        prepMinutes: 30,
      });

      expect(error.code).toBe(ErrorCodes.ORDER_NOT_FOUND);
      expect(writes()).toEqual([]);
    });

    it('границу видимости usecase не придумывает — передаёт из токена', async () => {
      await accept();

      expect(repo.findForStatusChange).toHaveBeenCalledWith(SCOPE, ORDER_ID);
    });
  });
  describe('уведомления о смене статуса (Шаг 5.5)', () => {
    it('на каждое РЕАЛЬНОЕ изменение объявляется факт — и на авто-переход тоже', async () => {
      await accept();

      const events = published();
      expect(events).toHaveLength(2);
      expect(events[0]).toBeInstanceOf(OrderStatusChangedEvent);
      expect(events.map((e) => e.order.status)).toEqual([
        OrderStatus.ACCEPTED,
        OrderStatus.PREPARING,
      ]);

      expect(events[0].order).toMatchObject({
        id: ORDER_ID,
        orderNumber: 1043,
        userId: 'alice',
        restaurantId: SCOPE.restaurantId,
        branchId: SCOPE.branchId,
      });
    });

    it('повторный клик НЕ объявляет ничего — телефон клиента молчит', async () => {
      await accept();
      events.publish.mockClear();

      await accept();

      expect(published()).toEqual([]);
    });

    it('проигранная гонка тоже молчит: уведомил тот, кто изменил', async () => {
      repo.changeStatus.mockImplementationOnce(() => {
        status = OrderStatus.PREPARING;
        return Promise.resolve(null);
      });

      await accept();

      expect(published()).toEqual([]);
    });

    it('отказ объявляется с причиной — её увидит клиент', async () => {
      status = OrderStatus.PREPARING;
      repo.changeStatus.mockImplementation((input: StatusChange) => {
        if (input.expectedFrom !== status) return Promise.resolve(null);
        status = input.status;
        return Promise.resolve({ ...row(), cancelReason: 'кончилось тесто' });
      });

      await run({
        status: OrderStatus.CANCELLED,
        cancelReason: 'кончилось тесто',
      });

      expect(published()[0].order).toMatchObject({
        status: OrderStatus.CANCELLED,
        cancelReason: 'кончилось тесто',
      });
    });
  });
});
