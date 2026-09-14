import {
  OrderStatus,
  OrderType,
  RestaurantOrderListItemView,
} from '@foodhubme/shared';
import { ApiProperty } from '@nestjs/swagger';
import type { Branch, Order } from '@prisma/client';

export type RestaurantOrderListRow = Order & {
  branch: Pick<Branch, 'address'>;
  _count: { items: number };
};

export class RestaurantOrderListItemViewDto implements RestaurantOrderListItemView {
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
  branchId!: string;

  @ApiProperty({ example: 'пр. В. Путина, 1' })
  branchAddress!: string;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'г. Грозный, пр. Путина, 12',
    description: 'Куда везти. null у самовывоза и заказа в зале.',
  })
  deliveryAddress!: string | null;

  @ApiProperty({
    example: 3,
    description: 'Сколько разных строк в заказе — для подписи «3 позиции».',
  })
  itemsCount!: number;

  @ApiProperty({ example: 1389 })
  total!: number;

  static mapToView(
    order: RestaurantOrderListRow,
  ): RestaurantOrderListItemViewDto {
    const dto = new RestaurantOrderListItemViewDto();

    dto.id = order.id;
    dto.orderNumber = order.orderNumber;
    dto.status = order.status as OrderStatus;
    dto.orderType = order.orderType as OrderType;
    dto.createdAt = order.createdAt.toISOString();

    dto.branchId = order.branchId;
    dto.branchAddress = order.branch.address;
    dto.deliveryAddress = order.deliveryAddress;

    dto.itemsCount = order._count.items;
    dto.total = order.total.toNumber();

    return dto;
  }
}
