import { DeliveryQuote, OrderBlockReason, OrderType } from '@foodhubme/shared';
import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Placement } from '../../domain/rules/order-placement';

export class DeliveryQuoteViewDto implements DeliveryQuote {
  @ApiProperty({
    example: true,
    description: 'Можно ли оформить заказ прямо сейчас.',
  })
  canOrder!: boolean;

  @ApiProperty({
    enum: OrderBlockReason,
    nullable: true,
    example: null,
    description:
      'Что мешает оформить: нет точки, не тот тип, далеко, закрыто, ' +
      'не принимают, не набрана сумма. null — ничего не мешает.',
  })
  blockReason!: OrderBlockReason | null;

  @ApiProperty({
    nullable: true,
    type: String,
    format: 'uuid',
    example: '33333333-0000-0000-0000-000000000001',
    description: 'Точка-исполнитель. Для доставки её выбрал backend.',
  })
  branchId!: string | null;

  @ApiProperty({ nullable: true, type: String, example: 'пр. В. Путина, 1' })
  branchAddress!: string | null;

  @ApiProperty({ nullable: true, type: String, example: '22:00' })
  closesAt!: string | null;

  @ApiProperty({
    nullable: true,
    type: Number,
    example: 3.42,
    description: 'Расстояние по прямой, км. null — самовывоз или зал.',
  })
  distanceKm!: number | null;

  @ApiProperty({ example: 1240, description: 'Сумма позиций, ₽' })
  itemsTotal!: number;

  @ApiProperty({ example: 149, description: 'Стоимость доставки, ₽' })
  deliveryFee!: number;

  @ApiProperty({ example: false })
  isDeliveryFree!: boolean;

  @ApiProperty({ example: 1389, description: 'Итого к оплате, ₽' })
  total!: number;

  @ApiProperty({ example: 500, description: 'Минимальная сумма заказа, ₽' })
  minOrderAmount!: number;

  @ApiProperty({ example: 0, description: 'Сколько добрать до минимума, ₽' })
  amountToMinOrder!: number;

  @ApiProperty({
    nullable: true,
    type: Number,
    example: 260,
    description:
      'Сколько добрать до бесплатной доставки, ₽. 0 — уже бесплатно, ' +
      'null — акции нет или она не действует на этом расстоянии.',
  })
  amountToFreeDelivery!: number | null;

  static mapToView(
    placement: Placement,
    orderType: OrderType,
    itemsTotal: Prisma.Decimal,
    amountToFreeDelivery: Prisma.Decimal | null,
  ): DeliveryQuoteViewDto {
    const dto = new DeliveryQuoteViewDto();
    const { branch, deliveryFee } = placement;

    dto.canOrder = placement.canOrder;
    dto.blockReason = placement.blockReason;
    dto.branchId = branch?.id ?? null;
    dto.branchAddress = branch?.address ?? null;
    dto.closesAt = placement.closesAt;
    dto.distanceKm = placement.distanceKm;

    dto.itemsTotal = itemsTotal.toNumber();
    dto.deliveryFee = deliveryFee.toNumber();
    dto.isDeliveryFree =
      orderType === OrderType.DELIVERY &&
      placement.canOrder &&
      deliveryFee.isZero();
    dto.total = itemsTotal.plus(deliveryFee).toNumber();

    const minOrder = branch?.minOrderAmount ?? new Prisma.Decimal(0);
    dto.minOrderAmount = minOrder.toNumber();
    const left = minOrder.minus(itemsTotal);
    dto.amountToMinOrder = left.isPositive() ? left.toNumber() : 0;

    dto.amountToFreeDelivery = amountToFreeDelivery?.toNumber() ?? null;

    return dto;
  }
}
