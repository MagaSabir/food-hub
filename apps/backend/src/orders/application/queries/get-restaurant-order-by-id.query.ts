import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { StaffScope } from '../../../auth/domain/rules/staff-scope';
import { OrderViewDto } from '../../api/view-dto/order.view-dto';
import { OrderNotFoundError } from '../../domain/errors/orders.errors';
import { RestaurantOrdersQueryRepository } from '../../infrastructure/repositories/restaurant-orders.query-repository';

export class GetRestaurantOrderByIdQuery extends Query<OrderViewDto> {
  constructor(
    public readonly scope: StaffScope,
    public readonly orderId: string,
  ) {
    super();
  }
}

@QueryHandler(GetRestaurantOrderByIdQuery)
export class GetRestaurantOrderByIdQueryHandler implements IQueryHandler<
  GetRestaurantOrderByIdQuery,
  OrderViewDto
> {
  constructor(private readonly orders: RestaurantOrdersQueryRepository) {}

  async execute({
    scope,
    orderId,
  }: GetRestaurantOrderByIdQuery): Promise<OrderViewDto> {
    const order = await this.orders.findForStaffById(scope, orderId);

    if (order === null) throw new OrderNotFoundError(orderId);

    return order;
  }
}
