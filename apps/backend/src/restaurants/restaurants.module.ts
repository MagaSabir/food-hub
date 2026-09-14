import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RestaurantsController } from './api/restaurants.controller';
import { GetRestaurantsQueryHandler } from './application/queries/get-restaurants.query';
import { GetRestaurantBySlugQueryHandler } from './application/queries/get-restaurant-by-slug.query';
import { RestaurantsQueryRepository } from './infrastructure/restaurants.query-repository';

@Module({
  imports: [CqrsModule],
  controllers: [RestaurantsController],
  providers: [
    GetRestaurantsQueryHandler,
    GetRestaurantBySlugQueryHandler,
    RestaurantsQueryRepository,
  ],
})
export class RestaurantsModule {}
