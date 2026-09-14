import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../redis/cache.service';
import { CacheKeys, CacheTtl } from '../redis/cache-keys';
import { RestaurantNotFoundError } from '../restaurants/domain/errors/restaurants.errors';
import { VISIBLE_RESTAURANT } from '../restaurants/domain/rules/visible-restaurant';
import { MenuItemNotFoundError } from './errors/menu.errors';
import { MenuCategoryViewDto } from './view-dto/menu-category.view-dto';
import { MenuItemDetailsViewDto } from './view-dto/menu-item-details.view-dto';

@Injectable()
export class MenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  findBrandMenu(slug: string): Promise<MenuCategoryViewDto[]> {
    return this.cache.wrap(CacheKeys.brandMenu(slug), CacheTtl.MENU, () =>
      this.loadBrandMenu(slug),
    );
  }

  private async loadBrandMenu(slug: string): Promise<MenuCategoryViewDto[]> {
    const restaurant = await this.prisma.client.restaurant.findFirst({
      where: { slug, ...VISIBLE_RESTAURANT },
      select: { id: true },
    });
    if (!restaurant) throw new RestaurantNotFoundError(slug);

    const categories = await this.prisma.client.menuCategory.findMany({
      where: { restaurantId: restaurant.id, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: { modifierGroups: { select: { isRequired: true } } },
        },
      },
    });

    const now = new Date();
    return categories
      .filter((category) => category.items.length > 0)
      .map((category) => MenuCategoryViewDto.mapToView(category, now));
  }

  async findMenuItem(id: string): Promise<MenuItemDetailsViewDto> {
    const dish = await this.cache.wrap(
      CacheKeys.menuItem(id),
      CacheTtl.MENU_ITEM,
      () => this.loadMenuItem(id),
    );
    if (!dish) throw new MenuItemNotFoundError(id);
    return dish;
  }

  private async loadMenuItem(
    id: string,
  ): Promise<MenuItemDetailsViewDto | null> {
    const item = await this.prisma.client.menuItem.findFirst({
      where: {
        id,
        category: { isActive: true },
        restaurant: VISIBLE_RESTAURANT,
      },
      include: {
        modifierGroups: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            options: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
          },
        },
      },
    });

    return item ? MenuItemDetailsViewDto.mapToDetails(item, new Date()) : null;
  }
}
