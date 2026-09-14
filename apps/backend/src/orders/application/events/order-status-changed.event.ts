import { OrderStatus, OrderType } from '@foodhubme/shared';

export class OrderStatusChangedEvent {
  constructor(
    readonly order: {
      id: string;
      orderNumber: number;
      status: OrderStatus;
      type: OrderType;
      userId: string;
      restaurantId: string;
      branchId: string;
      prepMinutes: number | null;
      cancelReason: string | null;
    },
  ) {}
}
