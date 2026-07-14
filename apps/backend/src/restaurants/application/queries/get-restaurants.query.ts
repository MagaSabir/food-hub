import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { RestaurantsQueryRepository } from '../../infrastructure/restaurants.query-repository';
import { RestaurantListItemViewDto } from '../../api/view-dto/restaurant-list-item.view-dto';

export class GetRestaurantsQuery extends Query<RestaurantListItemViewDto[]> {}

@QueryHandler(GetRestaurantsQuery)
export class GetRestaurantsQueryHandler implements IQueryHandler<
  GetRestaurantsQuery,
  RestaurantListItemViewDto
> {
  constructor(private readonly queryRepository: RestaurantsQueryRepository) {}
  execute(): Promise<RestaurantListItemViewDto[]> {
    return this.queryRepository.finsCatalog();
  }
}
