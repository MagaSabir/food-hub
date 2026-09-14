import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import {
  CatalogFilters,
  RestaurantsQueryRepository,
} from '../../infrastructure/restaurants.query-repository';
import { RestaurantListItemViewDto } from '../../api/view-dto/restaurant-list-item.view-dto';

export class GetRestaurantsQuery extends Query<RestaurantListItemViewDto[]> {
  constructor(public readonly filters: CatalogFilters = {}) {
    super();
  }
}

@QueryHandler(GetRestaurantsQuery)
export class GetRestaurantsQueryHandler implements IQueryHandler<
  GetRestaurantsQuery,
  RestaurantListItemViewDto[]
> {
  constructor(private readonly queryRepository: RestaurantsQueryRepository) {}

  execute(query: GetRestaurantsQuery): Promise<RestaurantListItemViewDto[]> {
    return this.queryRepository.findCatalog(query.filters);
  }
}
