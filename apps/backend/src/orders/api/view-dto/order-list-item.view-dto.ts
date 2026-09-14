import { OrderListItemView, OrderStatus, OrderType } from '@foodhubme/shared';
import { ApiProperty } from '@nestjs/swagger';
import type { Branch, Order, Restaurant } from '@prisma/client';

export type OrderListRow = Order & {
  restaurant: Pick<Restaurant, 'name'>;
  branch: Pick<Branch, 'address'>;
  _count: { items: number };
};

export class OrderListItemViewDto implements OrderListItemView {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 1043 })
  orderNumber!: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status!: OrderStatus;

  @ApiProperty({ enum: OrderType, example: OrderType.DELIVERY })
  orderType!: OrderType;

  @ApiProperty({ example: '2026-08-20T12:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ format: 'uuid' })
  restaurantId!: string;

  @ApiProperty({ example: 'Сыроварня' })
  restaurantName!: string;

  @ApiProperty({ example: 'пр. В. Путина, 1' })
  branchAddress!: string;

  @ApiProperty({
    example: 3,
    description: 'Сколько разных строк в заказе — для подписи «3 товара».',
  })
  itemsCount!: number;

  @ApiProperty({ example: 1389 })
  total!: number;

  static mapToView(order: OrderListRow): OrderListItemViewDto {
    const dto = new OrderListItemViewDto();

    dto.id = order.id;
    dto.orderNumber = order.orderNumber;
    dto.status = order.status as OrderStatus;
    dto.orderType = order.orderType as OrderType;
    dto.createdAt = order.createdAt.toISOString();

    dto.restaurantId = order.restaurantId;
    dto.restaurantName = order.restaurant.name;
    dto.branchAddress = order.branch.address;

    dto.itemsCount = order._count.items;
    dto.total = order.total.toNumber();

    return dto;
  }
}
