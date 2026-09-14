import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RealtimeModule } from '../realtime/realtime.module';
import { OrdersController } from './api/orders.controller';
import { RestaurantOrdersController } from './api/restaurant-orders.controller';
import { GetDeliveryQuoteQueryHandler } from './application/queries/get-delivery-quote.query';
import { GetMyOrdersQueryHandler } from './application/queries/get-my-orders.query';
import { GetRestaurantOrderByIdQueryHandler } from './application/queries/get-restaurant-order-by-id.query';
import { GetRestaurantOrdersQueryHandler } from './application/queries/get-restaurant-orders.query';
import { GetOrderByIdQueryHandler } from './application/queries/get-order-by-id.query';
import { ChangeOrderStatusUseCase } from './application/usecases/change-order-status.usecase';
import { CreateOrderUseCase } from './application/usecases/create-order.usecase';
import { OrdersQueryRepository } from './infrastructure/repositories/orders.query-repository';
import { RestaurantOrdersQueryRepository } from './infrastructure/repositories/restaurant-orders.query-repository';
import { OrdersRepository } from './infrastructure/repositories/orders.repository';
import { NotifyBranchOnOrderCreated } from './application/event-handlers/notify-branch-on-order-created.handler';
import { NotifyOnOrderStatusChanged } from './application/event-handlers/notify-on-order-status-changed.handler';

@Module({
  imports: [CqrsModule, RealtimeModule],
  controllers: [OrdersController, RestaurantOrdersController],
  providers: [
    GetDeliveryQuoteQueryHandler,
    GetMyOrdersQueryHandler,
    GetOrderByIdQueryHandler,
    GetRestaurantOrdersQueryHandler,
    GetRestaurantOrderByIdQueryHandler,
    CreateOrderUseCase,
    ChangeOrderStatusUseCase,
    NotifyBranchOnOrderCreated,
    NotifyOnOrderStatusChanged,
    OrdersRepository,
    OrdersQueryRepository,
    RestaurantOrdersQueryRepository,
  ],
})
export class OrdersModule {}
