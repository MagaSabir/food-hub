import { Injectable } from '@nestjs/common';
import { CatalogSort } from '@foodhubme/shared';
import type { GeoPoint } from '../../orders/domain/rules/distance';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../redis/cache.service';
import { CacheKeys, CacheTtl } from '../../redis/cache-keys';
import {
  CATALOG_CARD_BRANCH_SELECT,
  toCatalogCard,
} from '../api/view-dto/catalog-card';
import { RestaurantListItemViewDto } from '../api/view-dto/restaurant-list-item.view-dto';
import { RestaurantDetailsViewDto } from '../api/view-dto/restaurant-details.view-dto';
import { BranchViewDto } from '../api/view-dto/branch.view-dto';
import {
  deliveryReach,
  type ReachBranch,
} from '../domain/rules/delivery-reach';
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

interface CatalogSnapshot {
  cards: RestaurantListItemViewDto[];
  reach: Record<string, ReachBranch[]>;
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

  async findCatalog(
    filters: CatalogFilters = {},
    destination: GeoPoint | null = null,
  ): Promise<RestaurantListItemViewDto[]> {
    const snapshot = await this.snapshot(filters);

    if (destination === null) return snapshot.cards;

    return snapshot.cards.map((card) => ({
      ...card,
      ...deliveryReach(snapshot.reach[card.id] ?? [], destination),
    }));
  }

  private snapshot(filters: CatalogFilters): Promise<CatalogSnapshot> {
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

  private async loadCatalog(filters: CatalogFilters): Promise<CatalogSnapshot> {
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
            ...CATALOG_CARD_BRANCH_SELECT,
            latitude: true,
            longitude: true,
            deliveryMaxRadiusKm: true,
          },
        },
      },
    });

    const now = new Date();
    const items = rows.map((r) => toCatalogCard(r, now));

    const cards = filters.open ? items.filter((item) => item.isOpen) : items;

    return {
      cards,
      reach: Object.fromEntries(
        rows.map((r) => [
          r.id,
          r.branches.map((b) => ({
            latitude: b.latitude,
            longitude: b.longitude,
            hasDelivery: b.hasDelivery,
            deliveryMaxRadiusKm: b.deliveryMaxRadiusKm?.toNumber() ?? null,
          })),
        ]),
      ),
    };
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
