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
    return dto;
  }
}
