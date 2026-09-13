import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetRestaurantsQuery } from '../application/queries/get-restaurants.query';
import { ApiGetRestaurants } from './docs/get-restaurants.docs';
import { ApiTags } from '@nestjs/swagger';
import { RestaurantListItemViewDto } from './view-dto/restaurant-list-item.view-dto';
import { Public } from '../../auth/api/decorators/public.decorator';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Public()
  @Get()
  @ApiGetRestaurants()
  getRestaurants(): Promise<RestaurantListItemViewDto[]> {
    return this.queryBus.execute(new GetRestaurantsQuery());
  }
}
