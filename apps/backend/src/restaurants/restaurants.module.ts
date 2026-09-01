import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RestaurantsController } from './api/restaurants.controller';
import { RestaurantsQueryRepository } from './infrastructure/restaurants.query-repository';
import { PrismaModule } from '../prisma/prisma.module';
import { GetRestaurantsQueryHandler } from './application/queries/get-restaurants.query';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsQueryRepository, GetRestaurantsQueryHandler],
})
export class RestaurantsModule {}
