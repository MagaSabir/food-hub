import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetRestaurantsQuery } from '../application/queries/get-restaurants.query';
import { RestaurantListItemViewDto } from './view-dto/restaurant-list-item.view-dto';
import { ApiGetRestaurants } from './docs/get-restaurant.docs';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiGetRestaurants()
  list(): Promise<RestaurantListItemViewDto[]> {
    return this.queryBus.execute(new GetRestaurantsQuery());
  }
}
