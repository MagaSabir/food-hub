import {
  RepeatSkipReason,
  type RepeatItemView,
  type RepeatOptionView,
  type RepeatOrderView,
  type RepeatSkippedView,
} from '@foodhubme/shared';
import { ApiProperty } from '@nestjs/swagger';

export class RepeatOptionViewDto implements RepeatOptionView {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '30 см' })
  name!: string;

  @ApiProperty({ example: 'Размер' })
  groupName!: string;

  @ApiProperty({ example: 150, description: 'Доплата сегодня, ₽' })
  priceDelta!: number;
}

export class RepeatItemViewDto implements RepeatItemView {
  @ApiProperty({ format: 'uuid' })
  menuItemId!: string;

  @ApiProperty({ example: 'Маргарита' })
  name!: string;

  @ApiProperty({ nullable: true, type: String })
  photoUrl!: string | null;

  @ApiProperty({
    example: 740,
    description: 'Цена штуки СЕГОДНЯ, с модификаторами и действующей скидкой',
  })
  price!: number;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ type: RepeatOptionViewDto, isArray: true })
  options!: RepeatOptionViewDto[];
}

export class RepeatSkippedViewDto implements RepeatSkippedView {
  @ApiProperty({ example: 'Пепперони', description: 'Имя из чека' })
  name!: string;

  @ApiProperty({
    enum: RepeatSkipReason,
    example: RepeatSkipReason.UNAVAILABLE,
  })
  reason!: RepeatSkipReason;
}

export class RepeatOrderViewDto implements RepeatOrderView {
  @ApiProperty({ format: 'uuid' })
  restaurantId!: string;

  @ApiProperty({ example: 'vasabi' })
  restaurantSlug!: string;

  @ApiProperty({ example: 'Васаби' })
  restaurantName!: string;

  @ApiProperty({ type: RepeatItemViewDto, isArray: true })
  items!: RepeatItemViewDto[];

  @ApiProperty({ type: RepeatSkippedViewDto, isArray: true })
  skipped!: RepeatSkippedViewDto[];
}
