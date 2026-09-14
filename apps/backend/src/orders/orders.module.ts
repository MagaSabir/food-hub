import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OrdersController } from './api/orders.controller';
import { GetDeliveryQuoteQueryHandler } from './application/queries/get-delivery-quote.query';
import { GetMyOrdersQueryHandler } from './application/queries/get-my-orders.query';
import { GetOrderByIdQueryHandler } from './application/queries/get-order-by-id.query';
import { CreateOrderUseCase } from './application/usecases/create-order.usecase';
import { OrdersQueryRepository } from './infrastructure/repositories/orders.query-repository';
import { OrdersRepository } from './infrastructure/repositories/orders.repository';

@Module({
  imports: [CqrsModule],
  controllers: [OrdersController],
  providers: [
    GetDeliveryQuoteQueryHandler,
    GetMyOrdersQueryHandler,
    GetOrderByIdQueryHandler,
    CreateOrderUseCase,
    OrdersRepository,
    OrdersQueryRepository,
  ],
})
export class OrdersModule {}
