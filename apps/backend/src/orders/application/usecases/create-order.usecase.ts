import { OrderBlockReason, OrderType, PaymentMethod } from '@foodhubme/shared';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { InvalidAccessTokenError } from '../../../auth/domain/errors/auth.errors';
import { RESTAURANT_TIMEZONE } from '../../../restaurants/domain/policies/catalog.policy';
import { OrderViewDto } from '../../api/view-dto/order.view-dto';
import {
  OrderNotAvailableError,
  PaymentMethodUnavailableError,
} from '../../domain/errors/orders.errors';
import { calculateOrder } from '../../domain/rules/order-calculation';
import { Placement } from '../../domain/rules/order-placement';
import { OrdersRepository } from '../../infrastructure/repositories/orders.repository';
import { CreateOrderDto } from '../dto/create-order.application.dto';

export class CreateOrderCommand extends Command<OrderViewDto> {
  constructor(public readonly dto: CreateOrderDto) {
    super();
  }
}

@CommandHandler(CreateOrderCommand)
export class CreateOrderUseCase implements ICommandHandler<
  CreateOrderCommand,
  OrderViewDto
> {
  constructor(private readonly orders: OrdersRepository) {}

  async execute({ dto }: CreateOrderCommand): Promise<OrderViewDto> {
    if (dto.paymentMethod !== PaymentMethod.CASH) {
      throw new PaymentMethodUnavailableError(dto.paymentMethod);
    }

    const [context, client] = await Promise.all([
      this.orders.findOrderContext(
        dto.restaurantId,
        dto.items.map((item) => item.menuItemId),
      ),
      this.orders.findClient(dto.userId),
    ]);

    if (client === null) throw new InvalidAccessTokenError();

    const now = new Date();

    const { lines, itemsTotal, placement } = calculateOrder(
      context,
      dto,
      now,
      RESTAURANT_TIMEZONE,
    );

    if (!placement.canOrder || placement.branch === null) {
      throw new OrderNotAvailableError(
        placement.blockReason ?? OrderBlockReason.NO_BRANCH,
        this.explain(placement, itemsTotal),
      );
    }

    const total = itemsTotal.plus(placement.deliveryFee);

    const order = await this.orders.createOrder({
      userId: client.id,
      restaurantId: dto.restaurantId,
      branchId: placement.branch.id,
      orderType: dto.orderType,
      paymentMethod: dto.paymentMethod,
      contactPhone: dto.contactPhone ?? client.phone,
      comment: dto.comment,
      delivery:
        dto.orderType === OrderType.DELIVERY &&
        dto.delivery !== null &&
        placement.distanceKm !== null
          ? {
              address: dto.delivery.address,
              details: dto.delivery.details,
              latitude: dto.delivery.latitude,
              longitude: dto.delivery.longitude,
              distanceKm: new Prisma.Decimal(placement.distanceKm.toFixed(2)),
            }
          : null,
      itemsTotal,
      deliveryFee: placement.deliveryFee,
      total,
      lines,
    });

    return OrderViewDto.mapToView(order);
  }

  private explain(
    placement: Placement,
    itemsTotal: Prisma.Decimal,
  ): string | undefined {
    if (
      placement.blockReason === OrderBlockReason.MIN_ORDER &&
      placement.branch !== null
    ) {
      const left = placement.branch.minOrderAmount.minus(itemsTotal);
      return `доберите ${left.toFixed(0)} ₽`;
    }

    if (
      placement.blockReason === OrderBlockReason.TOO_FAR &&
      placement.distanceKm !== null
    ) {
      return `до вас ${placement.distanceKm.toFixed(1)} км`;
    }

    return undefined;
  }
}
