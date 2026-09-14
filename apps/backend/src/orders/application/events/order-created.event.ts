export class OrderCreatedEvent {
  constructor(
    readonly order: {
      id: string;
      orderNumber: number;
      restaurantId: string;
      branchId: string;
      createdAt: Date;
    },
  ) {}
}
