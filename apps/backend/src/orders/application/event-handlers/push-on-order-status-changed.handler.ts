import { OrderStatusPushData, PUSH_DATA_TYPES } from '@foodhubme/shared';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PushNotifier } from '../../../notifications/push/push.notifier';
import { orderStatusPush } from '../../domain/rules/order-push';
import { OrderStatusChangedEvent } from '../events/order-status-changed.event';

@EventsHandler(OrderStatusChangedEvent)
export class PushOnOrderStatusChanged implements IEventHandler<OrderStatusChangedEvent> {
  constructor(private readonly push: PushNotifier) {}

  async handle({ order }: OrderStatusChangedEvent): Promise<void> {
    const text = orderStatusPush(order);

    if (text === null) return;

    const data: OrderStatusPushData = {
      type: PUSH_DATA_TYPES.ORDER_STATUS,
      orderId: order.id,
      status: order.status,
    };

    await this.push.notify(order.userId, { ...text, data });
  }
}
