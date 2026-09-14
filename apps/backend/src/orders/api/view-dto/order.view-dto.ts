import {
  OrderItemView,
  OrderModifierView,
  OrderStatus,
  OrderType,
  OrderView,
  PaymentMethod,
  PaymentStatus,
} from '@foodhubme/shared';
import { ApiProperty } from '@nestjs/swagger';
import type { OrderWithDetails } from '../../infrastructure/repositories/orders.repository';

export class OrderModifierViewDto implements OrderModifierView {
  @ApiProperty({ example: 'Размер' })
  groupName!: string;

  @ApiProperty({ example: '30 см' })
  optionName!: string;

  @ApiProperty({
    example: 150,
    description: 'Доплата, ₽. Может быть отрицательной («без соуса −20 ₽»).',
  })
  priceDelta!: number;
}

export class OrderItemViewDto implements OrderItemView {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    nullable: true,
    type: String,
    format: 'uuid',
    description:
      'Позиция меню — нужна только для «повторить заказ». null означает, ' +
      'что блюдо удалили из меню; на сам чек это не влияет.',
  })
  menuItemId!: string | null;

  @ApiProperty({ example: 'Пицца Маргарита' })
  name!: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description:
      'Фото на момент заказа (снимок). null — у позиции фото не было.',
  })
  photoUrl!: string | null;

  @ApiProperty({
    example: 449,
    description: 'Цена штуки без модификаторов — та, что действовала тогда.',
  })
  basePrice!: number;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({
    example: 1198,
    description: '(basePrice + Σ модификаторов) × quantity.',
  })
  lineTotal!: number;

  @ApiProperty({ type: [OrderModifierViewDto] })
  modifiers!: OrderModifierViewDto[];
}

export class OrderViewDto implements OrderView {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    example: 1043,
    description: 'Человеческий номер заказа — его называют вслух.',
  })
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

  @ApiProperty({
    format: 'uuid',
    description: 'Точка-исполнитель. Для доставки её выбрал backend.',
  })
  branchId!: string;

  @ApiProperty({ example: 'пр. В. Путина, 1' })
  branchAddress!: string;

  @ApiProperty({ nullable: true, type: String, example: 'пр. Путина, 12' })
  deliveryAddress!: string | null;

  @ApiProperty({ nullable: true, type: String, example: 'подъезд 2, этаж 5' })
  deliveryDetails!: string | null;

  @ApiProperty({ nullable: true, type: Number, example: 3.42 })
  distanceKm!: number | null;

  @ApiProperty({ example: '+79280000000' })
  contactPhone!: string;

  @ApiProperty({ nullable: true, type: String, example: 'Без лука' })
  comment!: string | null;

  @ApiProperty({ example: 1240 })
  itemsTotal!: number;

  @ApiProperty({ example: 149 })
  deliveryFee!: number;

  @ApiProperty({ example: 0, description: 'Промокоды — Этап 11; пока 0.' })
  discountAmount!: number;

  @ApiProperty({ example: 1389 })
  total!: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  paymentMethod!: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  paymentStatus!: PaymentStatus;

  @ApiProperty({
    nullable: true,
    type: Number,
    example: 30,
    description:
      'Сколько минут готовят — обещание ресторана, данное при приёме. ' +
      'null: ещё не приняли или отклонили.',
  })
  prepMinutes!: number | null;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'Закончилось тесто, сегодня пиццу не сделаем',
    description: 'Почему отклонили. Заполнено только у CANCELLED.',
  })
  cancelReason!: string | null;

  @ApiProperty({ type: [OrderItemViewDto] })
  items!: OrderItemViewDto[];

  static mapToView(order: OrderWithDetails): OrderViewDto {
    const dto = new OrderViewDto();

    dto.id = order.id;
    dto.orderNumber = order.orderNumber;
    dto.status = order.status as OrderStatus;
    dto.orderType = order.orderType as OrderType;
    dto.createdAt = order.createdAt.toISOString();

    dto.restaurantId = order.restaurantId;
    dto.restaurantName = order.restaurant.name;
    dto.branchId = order.branchId;
    dto.branchAddress = order.branch.address;

    dto.deliveryAddress = order.deliveryAddress;
    dto.deliveryDetails = order.deliveryDetails;
    dto.distanceKm = order.distanceKm?.toNumber() ?? null;

    dto.prepMinutes = order.prepMinutes;
    dto.cancelReason = order.cancelReason;

    dto.contactPhone = order.contactPhone;
    dto.comment = order.comment;

    dto.itemsTotal = order.itemsTotal.toNumber();
    dto.deliveryFee = order.deliveryFee.toNumber();
    dto.discountAmount = order.discountAmount.toNumber();
    dto.total = order.total.toNumber();

    dto.paymentMethod = order.paymentMethod as PaymentMethod;
    dto.paymentStatus = order.paymentStatus as PaymentStatus;

    dto.items = order.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.nameSnapshot,
      photoUrl: item.photoSnapshot,
      basePrice: item.basePriceSnapshot.toNumber(),
      quantity: item.quantity,
      lineTotal: item.lineTotal.toNumber(),
      modifiers: item.modifiers.map((modifier) => ({
        groupName: modifier.groupNameSnapshot,
        optionName: modifier.optionNameSnapshot,
        priceDelta: modifier.priceDeltaSnapshot.toNumber(),
      })),
    }));

    return dto;
  }
}
