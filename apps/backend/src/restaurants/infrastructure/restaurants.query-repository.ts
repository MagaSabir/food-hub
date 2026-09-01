import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CATALOG_SELECT,
  RestaurantListItemViewDto,
} from '../api/view-dto/restaurant-list-item.view-dto';

@Injectable()
export class RestaurantsQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCatalog(): Promise<RestaurantListItemViewDto[]> {
    const rows = await this.prisma.restaurant.findMany({
      where: { isActive: true, showInCatalog: true },
      select: CATALOG_SELECT,
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => RestaurantListItemViewDto.mapToView(row));
  }
}
