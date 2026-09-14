import {
  OrderStatusEvent,
  OrderUpdatedEvent,
  WS_EVENTS,
} from '@foodhubme/shared';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RealtimeNotifier } from '../../../realtime/realtime.notifier';
import { OrderStatusChangedEvent } from '../events/order-status-changed.event';

@EventsHandler(OrderStatusChangedEvent)
export class NotifyOnOrderStatusChanged implements IEventHandler<OrderStatusChangedEvent> {
  constructor(private readonly realtime: RealtimeNotifier) {}

  handle({ order }: OrderStatusChangedEvent): void {
    const forClient: OrderStatusEvent = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      prepMinutes: order.prepMinutes,
      cancelReason: order.cancelReason,
    };
    this.realtime.emitToClient(order.userId, WS_EVENTS.ORDER_STATUS, forClient);

    const forBranch: OrderUpdatedEvent = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      branchId: order.branchId,
      status: order.status,
    };
    this.realtime.emitToBranch(
      { restaurantId: order.restaurantId, branchId: order.branchId },
      WS_EVENTS.ORDER_UPDATED,
      forBranch,
    );
  }
}
