import type { Restaurant } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import type { RestaurantListItem } from '@foodhubme/shared';

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

  /** Собрать view-модель из Prisma-строки бренда (Decimal-рейтинги → number). */
  static mapToView(r: Restaurant): RestaurantListItemViewDto {
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
    return dto;
  }
}
