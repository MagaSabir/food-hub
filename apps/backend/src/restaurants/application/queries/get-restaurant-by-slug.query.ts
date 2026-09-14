import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { RestaurantsQueryRepository } from '../../infrastructure/restaurants.query-repository';
import { RestaurantDetailsViewDto } from '../../api/view-dto/restaurant-details.view-dto';
import { RestaurantNotFoundError } from '../../domain/errors/restaurants.errors';

export class GetRestaurantBySlugQuery extends Query<RestaurantDetailsViewDto> {
  constructor(public readonly slug: string) {
    super();
  }
}

@QueryHandler(GetRestaurantBySlugQuery)
export class GetRestaurantBySlugQueryHandler implements IQueryHandler<
  GetRestaurantBySlugQuery,
  RestaurantDetailsViewDto
> {
  constructor(private readonly queryRepository: RestaurantsQueryRepository) {}

  async execute(
    query: GetRestaurantBySlugQuery,
  ): Promise<RestaurantDetailsViewDto> {
    const restaurant = await this.queryRepository.findDetailsBySlug(query.slug);
    if (!restaurant) throw new RestaurantNotFoundError(query.slug);
    return restaurant;
  }
}
