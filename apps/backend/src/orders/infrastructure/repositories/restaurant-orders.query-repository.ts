import { OrderStatus } from '@foodhubme/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StaffScope } from '../../../auth/domain/rules/staff-scope';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderViewDto } from '../../api/view-dto/order.view-dto';
import { RestaurantOrderListItemViewDto } from '../../api/view-dto/restaurant-order-list-item.view-dto';
import { OrderPolicy } from '../../domain/policies/order.policy';
import { ORDER_CARD_INCLUDE } from './orders.repository';
import { staffScopeWhere } from './staff-scope.where';

@Injectable()
export class RestaurantOrdersQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findForStaff(
    scope: StaffScope,
    status: OrderStatus | null,
  ): Promise<RestaurantOrderListItemViewDto[]> {
    const orders = await this.prisma.client.order.findMany({
      where: this.scopeWhere(scope, status),
      orderBy: { createdAt: 'desc' },
      take: OrderPolicy.HISTORY_LIMIT,
      include: {
        branch: { select: { address: true } },
        _count: { select: { items: true } },
      },
    });

    return orders.map((order) =>
      RestaurantOrderListItemViewDto.mapToView(order),
    );
  }

  async findForStaffById(
    scope: StaffScope,
    orderId: string,
  ): Promise<OrderViewDto | null> {
    const order = await this.prisma.client.order.findFirst({
      where: { id: orderId, ...this.scopeWhere(scope, null) },
      include: ORDER_CARD_INCLUDE,
    });

    return order === null ? null : OrderViewDto.mapToView(order);
  }

  private scopeWhere(
    scope: StaffScope,
    status: OrderStatus | null,
  ): Prisma.OrderWhereInput {
    return { ...staffScopeWhere(scope), ...(status ? { status } : {}) };
  }
}
