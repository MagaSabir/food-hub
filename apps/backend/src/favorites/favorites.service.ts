import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantNotFoundError } from '../restaurants/domain/errors/restaurants.errors';
import { RestaurantListItemViewDto } from '../restaurants/api/view-dto/restaurant-list-item.view-dto';
import {
  CATALOG_CARD_BRANCH_SELECT,
  toCatalogCard,
} from '../restaurants/api/view-dto/catalog-card';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string): Promise<RestaurantListItemViewDto[]> {
    const rows = await this.prisma.client.userFavorite.findMany({
      where: {
        userId,
        restaurant: { isActive: true, showInCatalog: true },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: {
          include: {
            branches: {
              where: { isActive: true },
              select: CATALOG_CARD_BRANCH_SELECT,
            },
          },
        },
      },
    });

    const now = new Date();
    return rows.map((row) => toCatalogCard(row.restaurant, now));
  }

  async add(userId: string, restaurantId: string): Promise<void> {
    const restaurant = await this.prisma.client.restaurant.findFirst({
      where: { id: restaurantId, isActive: true, showInCatalog: true },
      select: { id: true },
    });
    if (!restaurant) throw new RestaurantNotFoundError(restaurantId);

    await this.prisma.client.userFavorite.upsert({
      where: { userId_restaurantId: { userId, restaurantId } },
      update: {},
      create: { userId, restaurantId },
    });
  }

  async remove(userId: string, restaurantId: string): Promise<void> {
    await this.prisma.client.userFavorite.deleteMany({
      where: { userId, restaurantId },
    });
  }
}
