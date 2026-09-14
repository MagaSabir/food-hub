import { OrderStatus } from '@foodhubme/shared';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { StaffScope } from '../../../auth/domain/rules/staff-scope';
import { RestaurantOrderListItemViewDto } from '../../api/view-dto/restaurant-order-list-item.view-dto';
import { RestaurantOrdersQueryRepository } from '../../infrastructure/repositories/restaurant-orders.query-repository';

export class GetRestaurantOrdersQuery extends Query<
  RestaurantOrderListItemViewDto[]
> {
  constructor(
    public readonly scope: StaffScope,
    public readonly status: OrderStatus | null,
  ) {
    super();
  }
}

@QueryHandler(GetRestaurantOrdersQuery)
export class GetRestaurantOrdersQueryHandler implements IQueryHandler<
  GetRestaurantOrdersQuery,
  RestaurantOrderListItemViewDto[]
> {
  constructor(private readonly orders: RestaurantOrdersQueryRepository) {}

  execute({
    scope,
    status,
  }: GetRestaurantOrdersQuery): Promise<RestaurantOrderListItemViewDto[]> {
    return this.orders.findForStaff(scope, status);
  }
}
