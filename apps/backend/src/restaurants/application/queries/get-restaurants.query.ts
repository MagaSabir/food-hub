import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { RestaurantListItemViewDto } from '../../api/view-dto/restaurant-list-item.view-dto';
import { RestaurantsQueryRepository } from '../../infrastructure/restaurants.query-repository';

export class GetRestaurantsQuery extends Query<RestaurantListItemViewDto[]> {}

@QueryHandler(GetRestaurantsQuery)
export class GetRestaurantsQueryHandler implements IQueryHandler<
  GetRestaurantsQuery,
  RestaurantListItemViewDto[]
> {
  constructor(private readonly queryRepository: RestaurantsQueryRepository) {}
  execute(): Promise<RestaurantListItemViewDto[]> {
    return this.queryRepository.findCatalog();
  }
}
