import { OrderStatus } from '@foodhubme/shared';

export class OrderStatusChangedEvent {
  constructor(
    readonly order: {
      id: string;
      orderNumber: number;
      status: OrderStatus;
      userId: string;
      restaurantId: string;
      branchId: string;
      prepMinutes: number | null;
      cancelReason: string | null;
    },
  ) {}
}
