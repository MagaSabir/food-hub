import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { cuisineVariants } from './cuisine-variants';
import {
  CATALOG_CARD_BRANCH_SELECT,
  toCatalogCard,
} from '../restaurants/api/view-dto/catalog-card';
import { RestaurantListItemViewDto } from '../restaurants/api/view-dto/restaurant-list-item.view-dto';
import { VISIBLE_RESTAURANT } from '../restaurants/domain/rules/visible-restaurant';
import { SearchPolicy } from './search.policy';
import { SearchDishViewDto } from './view-dto/search-dish.view-dto';
import { SearchResultsViewDto } from './view-dto/search-results.view-dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string): Promise<SearchResultsViewDto> {
    const q = query.trim();

    const [restaurants, dishes] = await Promise.all([
      this.findRestaurants(q),
      this.findDishes(q),
    ]);

    return SearchResultsViewDto.create(restaurants, dishes);
  }

  private async findRestaurants(
    q: string,
  ): Promise<RestaurantListItemViewDto[]> {
    const brands = await this.prisma.client.restaurant.findMany({
      where: {
        ...VISIBLE_RESTAURANT,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { cuisineTypes: { hasSome: cuisineVariants(q) } },
        ],
      },
      orderBy: { name: 'asc' },
      take: SearchPolicy.MAX_RESTAURANTS,
      include: {
        branches: {
          where: { isActive: true },
          select: CATALOG_CARD_BRANCH_SELECT,
        },
      },
    });

    const now = new Date();
    return brands.map((brand) => toCatalogCard(brand, now));
  }

  private async findDishes(q: string): Promise<SearchDishViewDto[]> {
    const dishes = await this.prisma.client.menuItem.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
        restaurant: VISIBLE_RESTAURANT,
        category: { isActive: true },
      },
      orderBy: [{ isAvailable: 'desc' }, { name: 'asc' }],
      take: SearchPolicy.MAX_DISHES,
      include: {
        restaurant: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
        modifierGroups: { select: { isRequired: true } },
      },
    });

    const now = new Date();
    return dishes.map((dish) => SearchDishViewDto.mapToView(dish, now));
  }
}
