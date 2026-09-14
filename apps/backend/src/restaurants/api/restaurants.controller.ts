import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/api/decorators/public.decorator';
import { GetRestaurantsQuery } from '../application/queries/get-restaurants.query';
import { GetRestaurantBySlugQuery } from '../application/queries/get-restaurant-by-slug.query';
import { CatalogQueryInputDto } from './input-dto/catalog-query.input-dto';
import { RestaurantListItemViewDto } from './view-dto/restaurant-list-item.view-dto';
import { RestaurantDetailsViewDto } from './view-dto/restaurant-details.view-dto';
import { ApiGetRestaurants } from './docs/get-restaurants.docs';
import { ApiGetRestaurantBySlug } from './docs/get-restaurant-by-slug.docs';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Public()
  @Get()
  @ApiGetRestaurants()
  list(
    @Query() query: CatalogQueryInputDto,
  ): Promise<RestaurantListItemViewDto[]> {
    const destination =
      query.lat !== undefined && query.lng !== undefined
        ? { latitude: query.lat, longitude: query.lng }
        : null;

    return this.queryBus.execute(new GetRestaurantsQuery(query, destination));
  }

  @Public()
  @Get('by-slug/:slug')
  @ApiGetRestaurantBySlug()
  bySlug(@Param('slug') slug: string): Promise<RestaurantDetailsViewDto> {
    return this.queryBus.execute(new GetRestaurantBySlugQuery(slug));
  }
}
