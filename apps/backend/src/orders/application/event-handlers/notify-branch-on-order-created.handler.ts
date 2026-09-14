import { NewOrderEvent, WS_EVENTS } from '@foodhubme/shared';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RealtimeNotifier } from '../../../realtime/realtime.notifier';
import { OrderCreatedEvent } from '../events/order-created.event';

@EventsHandler(OrderCreatedEvent)
export class NotifyBranchOnOrderCreated implements IEventHandler<OrderCreatedEvent> {
  constructor(private readonly realtime: RealtimeNotifier) {}

  handle({ order }: OrderCreatedEvent): void {
    const payload: NewOrderEvent = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      branchId: order.branchId,
      createdAt: order.createdAt.toISOString(),
    };

    this.realtime.emitToBranch(
      { restaurantId: order.restaurantId, branchId: order.branchId },
      WS_EVENTS.ORDER_NEW,
      payload,
    );
  }
}
