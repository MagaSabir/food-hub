import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { OrderViewDto } from '../../api/view-dto/order.view-dto';
import { OrderNotFoundError } from '../../domain/errors/orders.errors';
import { OrdersQueryRepository } from '../../infrastructure/repositories/orders.query-repository';

export class GetOrderByIdQuery extends Query<OrderViewDto> {
  constructor(
    public readonly userId: string,
    public readonly orderId: string,
  ) {
    super();
  }
}

@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdQueryHandler implements IQueryHandler<
  GetOrderByIdQuery,
  OrderViewDto
> {
  constructor(private readonly orders: OrdersQueryRepository) {}

  async execute({ userId, orderId }: GetOrderByIdQuery): Promise<OrderViewDto> {
    const order = await this.orders.findMineById(userId, orderId);

    if (order === null) throw new OrderNotFoundError(orderId);

    return order;
  }
}
