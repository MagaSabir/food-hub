import { ApiProperty } from '@nestjs/swagger';
import type { Restaurant } from '@prisma/client';
import type { RestaurantDetails } from '@foodhubme/shared';
import { RestaurantListItemViewDto } from './restaurant-list-item.view-dto';
import { deliveryPromise } from '../../domain/rules/delivery-promise';
import { BranchViewDto } from './branch.view-dto';

export class RestaurantDetailsViewDto
  extends RestaurantListItemViewDto
  implements RestaurantDetails
{
  @ApiProperty({
    type: [BranchViewDto],
    description:
      'Активные точки бренда. У одноточечных партнёров — одна. ' +
      'Клиент выбирает точку только для самовывоза, при доставке её назначает система.',
  })
  branches!: BranchViewDto[];

  @ApiProperty({
    type: [String],
    description:
      'Фото заведения: photos[0] — та же обложка, что в coverUrl, дальше ' +
      'галерея. Пустой массив — партнёр фото не залил.',
    example: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'],
  })
  photos!: string[];

  static mapToDetails(
    r: Restaurant,
    branches: BranchViewDto[],
  ): RestaurantDetailsViewDto {
    const dto = new RestaurantDetailsViewDto();
    Object.assign(
      dto,
      RestaurantListItemViewDto.mapToView(r, {
        isOpen: branches.some((b) => b.isOpen),
        ...deliveryPromise(branches),
      }),
    );
    dto.branches = branches;
    dto.photos = r.photos;
    return dto;
  }
}
