import { ApiProperty } from '@nestjs/swagger';
import type { Restaurant } from '@prisma/client';
import type { RestaurantListItem } from '@foodhubme/shared';
import type { DeliveryPromise } from '../../domain/rules/delivery-promise';

export class RestaurantListItemViewDto implements RestaurantListItem {
  @ApiProperty({
    format: 'uuid',
    example: '22222222-2222-2222-2222-222222222222',
  })
  id!: string;

  @ApiProperty({ example: 'Васаби' })
  name!: string;

  @ApiProperty({
    example: 'vasabi',
    description: 'Уникальный slug для ссылок/диплинков',
  })
  slug!: string;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'Суши и роллы с доставкой',
  })
  description!: string | null;

  @ApiProperty({ nullable: true, type: String, example: null })
  logoUrl!: string | null;

  @ApiProperty({ type: [String], example: ['суши', 'роллы'] })
  cuisineTypes!: string[];

  @ApiProperty({ example: 0, description: 'Рейтинг еды (0 до Этапа 10)' })
  ratingFood!: number;

  @ApiProperty({ example: 0, description: 'Рейтинг доставки (0 до Этапа 10)' })
  ratingDelivery!: number;

  @ApiProperty({ example: 0 })
  reviewsCount!: number;

  @ApiProperty({
    example: true,
    description:
      'Открыт ли сейчас (открыта хотя бы одна точка). Считает backend.',
  })
  isOpen!: boolean;

  @ApiProperty({
    nullable: true,
    type: Number,
    example: 149,
    description:
      'Обещание витрины: минимальная база доставки по точкам, ₽. Точную цену ' +
      'считает корзина по адресу. null — бренд не возит, только самовывоз.',
  })
  deliveryFeeFrom!: number | null;

  @ApiProperty({
    nullable: true,
    type: Number,
    example: 1500,
    description:
      '«Бесплатно от N ₽» — минимальный порог среди точек; null — акции нет.',
  })
  freeDeliveryFrom!: number | null;

  static mapToView(
    r: Restaurant,
    computed: { isOpen: boolean } & DeliveryPromise,
  ): RestaurantListItemViewDto {
    const dto = new RestaurantListItemViewDto();
    dto.id = r.id;
    dto.name = r.name;
    dto.slug = r.slug;
    dto.description = r.description;
    dto.logoUrl = r.logoUrl;
    dto.cuisineTypes = r.cuisineTypes;
    dto.ratingFood = r.ratingFood.toNumber();
    dto.ratingDelivery = r.ratingDelivery.toNumber();
    dto.reviewsCount = r.reviewsCount;
    dto.isOpen = computed.isOpen;
    dto.deliveryFeeFrom = computed.deliveryFeeFrom;
    dto.freeDeliveryFrom = computed.freeDeliveryFrom;
    return dto;
  }
}
