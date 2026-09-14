import { ApiProperty } from '@nestjs/swagger';
import type { SearchDishItem, SearchDishRestaurant } from '@foodhubme/shared';
import type { Restaurant } from '@prisma/client';
import {
  MenuItemListItemViewDto,
  type MenuItemWithGroupFlags,
} from '../../menu/view-dto/menu-item-list-item.view-dto';

export class SearchDishRestaurantViewDto implements SearchDishRestaurant {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Васаби' })
  name!: string;

  @ApiProperty({ example: 'vasabi', description: 'Для перехода на заведение' })
  slug!: string;

  @ApiProperty({ nullable: true, type: String })
  logoUrl!: string | null;
}

export type DishWithRestaurant = MenuItemWithGroupFlags & {
  restaurant: Pick<Restaurant, 'id' | 'name' | 'slug' | 'logoUrl'>;
};

export class SearchDishViewDto
  extends MenuItemListItemViewDto
  implements SearchDishItem
{
  @ApiProperty({ type: SearchDishRestaurantViewDto })
  restaurant!: SearchDishRestaurantViewDto;

  static override mapToView(
    dish: DishWithRestaurant,
    now: Date,
  ): SearchDishViewDto {
    const dto = SearchDishViewDto.fill(new SearchDishViewDto(), dish, now);

    dto.restaurant = {
      id: dish.restaurant.id,
      name: dish.restaurant.name,
      slug: dish.restaurant.slug,
      logoUrl: dish.restaurant.logoUrl,
    };

    return dto;
  }
}
