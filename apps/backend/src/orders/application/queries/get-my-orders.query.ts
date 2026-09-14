import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { OrderListItemViewDto } from '../../api/view-dto/order-list-item.view-dto';
import { OrdersQueryRepository } from '../../infrastructure/repositories/orders.query-repository';

export class GetMyOrdersQuery extends Query<OrderListItemViewDto[]> {
  constructor(public readonly userId: string) {
    super();
  }
}

@QueryHandler(GetMyOrdersQuery)
export class GetMyOrdersQueryHandler implements IQueryHandler<
  GetMyOrdersQuery,
  OrderListItemViewDto[]
> {
  constructor(private readonly orders: OrdersQueryRepository) {}

  execute({ userId }: GetMyOrdersQuery): Promise<OrderListItemViewDto[]> {
    return this.orders.findMine(userId);
  }
}
