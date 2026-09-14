import { NewOrderEvent, WS_EVENTS } from '@foodhubme/shared';
import { RealtimeNotifier } from '../../../realtime/realtime.notifier';
import { OrderCreatedEvent } from '../events/order-created.event';
import { NotifyBranchOnOrderCreated } from './notify-branch-on-order-created.handler';

describe('NotifyBranchOnOrderCreated', () => {
  const CREATED_AT = new Date('2026-08-20T11:00:00.000Z');

  const event = new OrderCreatedEvent({
    id: 'order-1',
    orderNumber: 1043,
    restaurantId: 'brand-1',
    branchId: 'branch-7',
    createdAt: CREATED_AT,
  });

  it('переводит факт домена в сообщение для точки', () => {
    const emitToBranch = jest.fn();

    new NotifyBranchOnOrderCreated({
      emitToBranch,
    } as unknown as RealtimeNotifier).handle(event);

    const payload: NewOrderEvent = {
      orderId: 'order-1',
      orderNumber: 1043,
      branchId: 'branch-7',
      createdAt: CREATED_AT.toISOString(),
    };

    expect(emitToBranch).toHaveBeenCalledWith(
      { restaurantId: 'brand-1', branchId: 'branch-7' },
      WS_EVENTS.ORDER_NEW,
      payload,
    );
  });
});
