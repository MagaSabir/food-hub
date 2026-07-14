import { Injectable } from '@nestjs/common';
import { RestaurantListItemViewDto } from '../api/view-dto/restaurant-list-item.view-dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RestaurantsQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async finsCatalog(): Promise<RestaurantListItemViewDto[]> {
    const rows = await this.prisma.restaurant.findMany({
      where: { isActive: true, showInCatalog: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => RestaurantListItemViewDto.mapToView(r));
  }
}
