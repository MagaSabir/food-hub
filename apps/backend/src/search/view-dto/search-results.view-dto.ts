import { ApiProperty } from '@nestjs/swagger';
import type { SearchResults } from '@foodhubme/shared';
import { RestaurantListItemViewDto } from '../../restaurants/api/view-dto/restaurant-list-item.view-dto';
import { SearchDishViewDto } from './search-dish.view-dto';

export class SearchResultsViewDto implements SearchResults {
  @ApiProperty({
    type: RestaurantListItemViewDto,
    isArray: true,
    description: 'Заведения — та же карточка, что в каталоге',
  })
  restaurants!: RestaurantListItemViewDto[];

  @ApiProperty({
    type: SearchDishViewDto,
    isArray: true,
    description: 'Блюда из меню любого бренда, с подписью, чьё это блюдо',
  })
  dishes!: SearchDishViewDto[];

  static create(
    restaurants: RestaurantListItemViewDto[],
    dishes: SearchDishViewDto[],
  ): SearchResultsViewDto {
    const dto = new SearchResultsViewDto();
    dto.restaurants = restaurants;
    dto.dishes = dishes;
    return dto;
  }
}
