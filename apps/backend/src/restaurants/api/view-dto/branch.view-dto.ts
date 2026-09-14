import { ApiProperty } from '@nestjs/swagger';
import type { Branch, City } from '@prisma/client';
import type { BranchInfo } from '@foodhubme/shared';
import { OpenState } from '../../domain/rules/working-hours';

export type BranchWithCity = Branch & { city: Pick<City, 'name'> };

export class BranchViewDto implements BranchInfo {
  @ApiProperty({
    format: 'uuid',
    example: '33333333-0000-0000-0000-000000000001',
  })
  id!: string;

  @ApiProperty({
    nullable: true,
    type: String,
    example: null,
    description: 'null = точка называется как бренд',
  })
  name!: string | null;

  @ApiProperty({ example: 'пр. В. Путина, 1' })
  address!: string;

  @ApiProperty({ example: '+7 928 000-00-00' })
  phone!: string;

  @ApiProperty({ example: 'Грозный' })
  cityName!: string;

  @ApiProperty({ nullable: true, type: Number, example: 43.3178 })
  latitude!: number | null;

  @ApiProperty({ nullable: true, type: Number, example: 45.6949 })
  longitude!: number | null;

  @ApiProperty({ example: true, description: 'Открыта сейчас (по графику)' })
  isOpen!: boolean;

  @ApiProperty({
    nullable: true,
    type: String,
    example: '22:00',
    description: 'До скольких работает сейчас; null, если закрыта',
  })
  closesAt!: string | null;

  @ApiProperty({ example: true, description: 'Тумблер приёма заказов' })
  acceptingOrders!: boolean;

  @ApiProperty({ example: true })
  hasDelivery!: boolean;

  @ApiProperty({ example: true })
  hasPickup!: boolean;

  @ApiProperty({ example: true })
  hasDineIn!: boolean;

  @ApiProperty({ example: 500, description: 'Минимальная сумма заказа, ₽' })
  minOrderAmount!: number;

  @ApiProperty({ example: 149, description: 'Базовая цена доставки, ₽' })
  deliveryBaseFee!: number;

  @ApiProperty({
    nullable: true,
    type: Number,
    example: 1500,
    description: 'Бесплатная доставка от суммы, ₽; null — акции нет',
  })
  freeDeliveryMinOrder!: number | null;

  static mapToView(b: BranchWithCity, openState: OpenState): BranchViewDto {
    const dto = new BranchViewDto();
    dto.id = b.id;
    dto.name = b.name;
    dto.address = b.address;
    dto.phone = b.phone;
    dto.cityName = b.city.name;
    dto.latitude = b.latitude;
    dto.longitude = b.longitude;
    dto.isOpen = openState.isOpen;
    dto.closesAt = openState.closesAt;
    dto.acceptingOrders = b.acceptingOrders;
    dto.hasDelivery = b.hasDelivery;
    dto.hasPickup = b.hasPickup;
    dto.hasDineIn = b.hasDineIn;
    dto.minOrderAmount = b.minOrderAmount.toNumber();
    dto.deliveryBaseFee = b.deliveryBaseFee.toNumber();
    dto.freeDeliveryMinOrder = b.freeDeliveryMinOrder?.toNumber() ?? null;
    return dto;
  }
}
