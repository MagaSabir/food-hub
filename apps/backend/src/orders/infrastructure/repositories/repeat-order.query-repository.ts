import type { RepeatOrderView } from '@foodhubme/shared';
import { Injectable } from '@nestjs/common';
import { getEffectivePrice } from '../../../menu/pricing';
import { PrismaService } from '../../../prisma/prisma.service';
import { VISIBLE_RESTAURANT } from '../../../restaurants/domain/rules/visible-restaurant';
import { planRepeat, type CurrentDish } from '../../domain/rules/repeat-order';

@Injectable()
export class RepeatOrderQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async planFor(
    userId: string,
    orderId: string,
  ): Promise<RepeatOrderView | null> {
    const order = await this.prisma.client.order.findFirst({
      where: { id: orderId, userId },
      select: {
        restaurant: { select: { id: true, slug: true, name: true } },
        items: {
          select: {
            menuItemId: true,
            nameSnapshot: true,
            quantity: true,
            modifiers: {
              select: { groupNameSnapshot: true, optionNameSnapshot: true },
            },
          },
        },
      },
    });

    if (order === null) return null;

    const visible = await this.prisma.client.restaurant.findFirst({
      where: { id: order.restaurant.id, ...VISIBLE_RESTAURANT },
      select: { id: true },
    });
    if (visible === null) return null;

    const menu = await this.currentMenu(
      order.items
        .map((item) => item.menuItemId)
        .filter((id): id is string => id !== null),
    );

    const plan = planRepeat(
      order.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.nameSnapshot,
        quantity: item.quantity,
        modifiers: item.modifiers.map((m) => ({
          groupName: m.groupNameSnapshot,
          optionName: m.optionNameSnapshot,
        })),
      })),
      menu,
    );

    return {
      restaurantId: order.restaurant.id,
      restaurantSlug: order.restaurant.slug,
      restaurantName: order.restaurant.name,
      ...plan,
    };
  }

  private async currentMenu(ids: string[]): Promise<Map<string, CurrentDish>> {
    if (ids.length === 0) return new Map();

    const dishes = await this.prisma.client.menuItem.findMany({
      where: { id: { in: ids }, category: { isActive: true } },
      include: {
        modifierGroups: {
          include: { options: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    const now = new Date();

    return new Map(
      dishes.map((dish) => [
        dish.id,
        {
          id: dish.id,
          name: dish.name,
          photoUrl: dish.photos[0] ?? null,
          price: getEffectivePrice(dish, now).price.toNumber(),
          isAvailable: dish.isAvailable,
          groups: dish.modifierGroups.map((group) => ({
            name: group.name,
            options: group.options.map((option) => ({
              id: option.id,
              name: option.name,
              priceDelta: option.priceDelta.toNumber(),
            })),
          })),
        } satisfies CurrentDish,
      ]),
    );
  }
}
