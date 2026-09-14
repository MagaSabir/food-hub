import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { RESTAURANT_TIMEZONE } from '../../../restaurants/domain/policies/catalog.policy';
import { DeliveryQuoteViewDto } from '../../api/view-dto/delivery-quote.view-dto';
import { calculateOrder } from '../../domain/rules/order-calculation';
import { OrdersRepository } from '../../infrastructure/repositories/orders.repository';
import { CreateOrderDto } from '../dto/create-order.application.dto';

export type DeliveryQuoteDto = Omit<
  CreateOrderDto,
  'userId' | 'paymentMethod' | 'contactPhone' | 'comment'
>;

export class GetDeliveryQuoteQuery extends Query<DeliveryQuoteViewDto> {
  constructor(public readonly dto: DeliveryQuoteDto) {
    super();
  }
}

@QueryHandler(GetDeliveryQuoteQuery)
export class GetDeliveryQuoteQueryHandler implements IQueryHandler<
  GetDeliveryQuoteQuery,
  DeliveryQuoteViewDto
> {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async execute(query: GetDeliveryQuoteQuery): Promise<DeliveryQuoteViewDto> {
    const { dto } = query;

    const context = await this.ordersRepository.findOrderContext(
      dto.restaurantId,
      dto.items.map((item) => item.menuItemId),
    );

    const { itemsTotal, placement, amountToFreeDelivery } = calculateOrder(
      context,
      dto,
      new Date(),
      RESTAURANT_TIMEZONE,
    );

    return DeliveryQuoteViewDto.mapToView(
      placement,
      dto.orderType,
      itemsTotal,
      amountToFreeDelivery,
    );
  }
}
