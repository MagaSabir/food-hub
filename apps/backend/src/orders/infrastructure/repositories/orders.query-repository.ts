import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderListItemViewDto } from '../../api/view-dto/order-list-item.view-dto';
import { OrderViewDto } from '../../api/view-dto/order.view-dto';
import { OrderPolicy } from '../../domain/policies/order.policy';
import { ORDER_CARD_INCLUDE } from './orders.repository';

@Injectable()
export class OrdersQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string): Promise<OrderListItemViewDto[]> {
    const orders = await this.prisma.client.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: OrderPolicy.HISTORY_LIMIT,
      include: {
        restaurant: { select: { name: true } },
        branch: { select: { address: true } },
        _count: { select: { items: true } },
      },
    });

    return orders.map((order) => OrderListItemViewDto.mapToView(order));
  }

  async findMineById(
    userId: string,
    orderId: string,
  ): Promise<OrderViewDto | null> {
    const order = await this.prisma.client.order.findFirst({
      where: { id: orderId, userId },
      include: ORDER_CARD_INCLUDE,
    });

    return order === null ? null : OrderViewDto.mapToView(order);
  }
}
