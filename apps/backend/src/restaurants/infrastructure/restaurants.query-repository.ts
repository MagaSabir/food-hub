import { Injectable } from '@nestjs/common';
import { CatalogSort } from '@foodhubme/shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../redis/cache.service';
import { CacheKeys, CacheTtl } from '../../redis/cache-keys';
import { RestaurantListItemViewDto } from '../api/view-dto/restaurant-list-item.view-dto';
import { RestaurantDetailsViewDto } from '../api/view-dto/restaurant-details.view-dto';
import { BranchViewDto } from '../api/view-dto/branch.view-dto';
import { deliveryPromise } from '../domain/rules/delivery-promise';
import { getOpenState } from '../domain/rules/working-hours';
import { VISIBLE_RESTAURANT } from '../domain/rules/visible-restaurant';
import {
  DEFAULT_CATALOG_SORT,
  RESTAURANT_TIMEZONE,
} from '../domain/policies/catalog.policy';

export interface CatalogFilters {
  sort?: CatalogSort;
  cuisine?: string;
  city?: string;
  open?: boolean;
}

const ORDER_BY: Record<
  CatalogSort,
  Prisma.RestaurantOrderByWithRelationInput[]
> = {
  [CatalogSort.NAME]: [{ name: 'asc' }],
  [CatalogSort.RATING]: [{ ratingFood: 'desc' }, { name: 'asc' }],
  [CatalogSort.REVIEWS]: [{ reviewsCount: 'desc' }, { name: 'asc' }],
  [CatalogSort.DELIVERY]: [{ ratingDelivery: 'desc' }, { name: 'asc' }],
};

@Injectable()
export class RestaurantsQueryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  findCatalog(
    filters: CatalogFilters = {},
  ): Promise<RestaurantListItemViewDto[]> {
    const isDefaultQuery =
      !filters.sort &&
      !filters.cuisine &&
      !filters.city &&
      filters.open === undefined;

    if (!isDefaultQuery) return this.loadCatalog(filters);

    return this.cache.wrap(CacheKeys.catalog(), CacheTtl.CATALOG, () =>
      this.loadCatalog(filters),
    );
  }

  private async loadCatalog(
    filters: CatalogFilters,
  ): Promise<RestaurantListItemViewDto[]> {
    const branchFilter: Prisma.BranchWhereInput = {
      isActive: true,
      ...(filters.city ? { city: { slug: filters.city } } : {}),
    };

    const rows = await this.prisma.client.restaurant.findMany({
      where: {
        ...VISIBLE_RESTAURANT,
        ...(filters.cuisine ? { cuisineTypes: { has: filters.cuisine } } : {}),
        branches: { some: branchFilter },
      },
      orderBy: ORDER_BY[filters.sort ?? DEFAULT_CATALOG_SORT],
      include: {
        branches: {
          where: branchFilter,
          select: {
            workingHours: true,
            hasDelivery: true,
            deliveryBaseFee: true,
            freeDeliveryMinOrder: true,
          },
        },
      },
    });

    const now = new Date();
    const items = rows.map((r) =>
      RestaurantListItemViewDto.mapToView(r, {
        isOpen: r.branches.some(
          (b) => getOpenState(b.workingHours, now, RESTAURANT_TIMEZONE).isOpen,
        ),
        ...deliveryPromise(
          r.branches.map((b) => ({
            hasDelivery: b.hasDelivery,
            deliveryBaseFee: b.deliveryBaseFee.toNumber(),
            freeDeliveryMinOrder: b.freeDeliveryMinOrder?.toNumber() ?? null,
          })),
        ),
      }),
    );

    return filters.open ? items.filter((item) => item.isOpen) : items;
  }

  findDetailsBySlug(slug: string): Promise<RestaurantDetailsViewDto | null> {
    return this.cache.wrap(
      CacheKeys.restaurant(slug),
      CacheTtl.RESTAURANT,
      () => this.loadDetailsBySlug(slug),
    );
  }

  private async loadDetailsBySlug(
    slug: string,
  ): Promise<RestaurantDetailsViewDto | null> {
    const row = await this.prisma.client.restaurant.findFirst({
      where: { slug, ...VISIBLE_RESTAURANT },
      include: {
        branches: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          include: { city: { select: { name: true } } },
        },
      },
    });
    if (!row) return null;

    const now = new Date();
    const branches = row.branches.map((b) =>
      BranchViewDto.mapToView(
        b,
        getOpenState(b.workingHours, now, RESTAURANT_TIMEZONE),
      ),
    );

    return RestaurantDetailsViewDto.mapToDetails(row, branches);
  }
}
