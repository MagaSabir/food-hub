import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetRestaurantsQuery } from '../application/queries/get-restaurants.query';
import { ApiGetRestaurants } from './docs/get-restaurants.docs';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiGetRestaurants()
  getRestaurants() {
    return this.queryBus.execute(new GetRestaurantsQuery());
  }
}
