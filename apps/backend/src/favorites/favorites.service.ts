import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantNotFoundError } from '../restaurants/domain/errors/restaurants.errors';
import { RestaurantListItemViewDto } from '../restaurants/api/view-dto/restaurant-list-item.view-dto';
import { deliveryPromise } from '../restaurants/domain/rules/delivery-promise';
import { getOpenState } from '../restaurants/domain/rules/working-hours';
import { RESTAURANT_TIMEZONE } from '../restaurants/domain/policies/catalog.policy';

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
              select: {
                workingHours: true,
                hasDelivery: true,
                deliveryBaseFee: true,
                freeDeliveryMinOrder: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();
    return rows.map((row) =>
      RestaurantListItemViewDto.mapToView(row.restaurant, {
        isOpen: row.restaurant.branches.some(
          (b) => getOpenState(b.workingHours, now, RESTAURANT_TIMEZONE).isOpen,
        ),
        ...deliveryPromise(
          row.restaurant.branches.map((b) => ({
            hasDelivery: b.hasDelivery,
            deliveryBaseFee: b.deliveryBaseFee.toNumber(),
            freeDeliveryMinOrder: b.freeDeliveryMinOrder?.toNumber() ?? null,
          })),
        ),
      }),
    );
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
