import { OrderStatus, OrderType, PaymentMethod } from '@foodhubme/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { VISIBLE_RESTAURANT } from '../../../restaurants/domain/rules/visible-restaurant';
import { OrderContext } from '../../domain/rules/order-calculation';
import { OrderLineSnapshot } from '../../domain/rules/order-lines';
import { StatusActor } from '../../domain/rules/status-actor';

export const ORDER_CARD_INCLUDE = {
  restaurant: { select: { name: true } },
  branch: { select: { address: true } },
  items: { include: { modifiers: true } },
} satisfies Prisma.OrderInclude;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof ORDER_CARD_INCLUDE;
}>;

export interface NewOrder {
  userId: string;
  restaurantId: string;
  branchId: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  contactPhone: string;
  comment: string | null;
  delivery: {
    address: string;
    details: string | null;
    latitude: number;
    longitude: number;
    distanceKm: Prisma.Decimal;
  } | null;
  itemsTotal: Prisma.Decimal;
  deliveryFee: Prisma.Decimal;
  total: Prisma.Decimal;
  lines: OrderLineSnapshot[];
}

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrderContext(
    restaurantId: string,
    menuItemIds: string[],
  ): Promise<OrderContext> {
    const restaurant = await this.prisma.client.restaurant.findFirst({
      where: { id: restaurantId, ...VISIBLE_RESTAURANT },
      select: {
        id: true,
        name: true,
        branches: { where: { isActive: true } },
      },
    });

    if (!restaurant) return { restaurant: null, branches: [], items: [] };

    const items = await this.prisma.client.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId,
        category: { isActive: true },
      },
      include: {
        modifierGroups: {
          orderBy: { sortOrder: 'asc' },
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });

    return {
      restaurant: { id: restaurant.id, name: restaurant.name },
      branches: restaurant.branches,
      items,
    };
  }

  findClient(userId: string): Promise<{ id: string; phone: string } | null> {
    return this.prisma.client.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, phone: true },
    });
  }

  createOrder(order: NewOrder): Promise<OrderWithDetails> {
    return this.prisma.runInTransaction(() =>
      this.prisma.client.order.create({
        data: {
          userId: order.userId,
          restaurantId: order.restaurantId,
          branchId: order.branchId,
          orderType: order.orderType,
          paymentMethod: order.paymentMethod,
          contactPhone: order.contactPhone,
          comment: order.comment,

          deliveryAddress: order.delivery?.address ?? null,
          deliveryDetails: order.delivery?.details ?? null,
          deliveryLat: order.delivery?.latitude ?? null,
          deliveryLng: order.delivery?.longitude ?? null,
          distanceKm: order.delivery?.distanceKm ?? null,

          itemsTotal: order.itemsTotal,
          deliveryFee: order.deliveryFee,
          total: order.total,

          items: {
            create: order.lines.map((line) => ({
              menuItemId: line.menuItemId,
              nameSnapshot: line.nameSnapshot,
              photoSnapshot: line.photoSnapshot,
              basePriceSnapshot: line.basePriceSnapshot,
              quantity: line.quantity,
              lineTotal: line.lineTotal,
              modifiers: { create: line.modifiers },
            })),
          },

          statusLog: {
            create: {
              status: OrderStatus.PENDING,
              changedBy: StatusActor.CLIENT,
            },
          },
        },
        include: ORDER_CARD_INCLUDE,
      }),
    );
  }
}
