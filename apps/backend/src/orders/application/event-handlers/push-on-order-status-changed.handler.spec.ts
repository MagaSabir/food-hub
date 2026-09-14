import { OrderStatus, OrderType, PUSH_DATA_TYPES } from '@foodhubme/shared';
import { PushMessage } from '../../../notifications/push/push-channel.interface';
import { PushNotifier } from '../../../notifications/push/push.notifier';
import { OrderStatusChangedEvent } from '../events/order-status-changed.event';
import { PushOnOrderStatusChanged } from './push-on-order-status-changed.handler';

const event = (over: Record<string, unknown> = {}) =>
  new OrderStatusChangedEvent({
    id: 'order-1',
    orderNumber: 1043,
    status: OrderStatus.ACCEPTED,
    type: OrderType.DELIVERY,
    userId: 'user-7',
    restaurantId: 'brand-1',
    branchId: 'branch-7',
    prepMinutes: 25,
    cancelReason: null,
    ...over,
  });

const makeHandler = () => {
  const notify = jest
    .fn<Promise<void>, [string, PushMessage]>()
    .mockResolvedValue(undefined);
  const handler = new PushOnOrderStatusChanged({
    notify,
  } as unknown as PushNotifier);

  return { handler, notify };
};

describe('PushOnOrderStatusChanged', () => {
  it('шлёт уведомление ХОЗЯИНУ заказа', async () => {
    const { handler, notify } = makeHandler();

    await handler.handle(event());

    expect(notify).toHaveBeenCalledWith('user-7', {
      title: 'Заказ №1043 принят',
      body: 'Готовим — будет готов примерно через 25 минут',
      data: {
        type: PUSH_DATA_TYPES.ORDER_STATUS,
        orderId: 'order-1',
        status: OrderStatus.ACCEPTED,
      },
    });
  });

  it('домен промолчал — не отправляем ничего', async () => {
    const { handler, notify } = makeHandler();

    await handler.handle(event({ status: OrderStatus.PREPARING }));

    expect(notify).not.toHaveBeenCalled();
  });

  it('в data уходит новый статус — приложению решать, куда вести', async () => {
    const { handler, notify } = makeHandler();

    await handler.handle(
      event({ status: OrderStatus.CANCELLED, cancelReason: 'Нет продуктов' }),
    );

    expect(notify.mock.calls[0][1].data).toMatchObject({
      orderId: 'order-1',
      status: OrderStatus.CANCELLED,
    });
  });
});
