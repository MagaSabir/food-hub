import type { Prisma, Restaurant } from '@prisma/client';
import { RESTAURANT_TIMEZONE } from '../../domain/policies/catalog.policy';
import { deliveryPromise } from '../../domain/rules/delivery-promise';
import { getOpenState } from '../../domain/rules/working-hours';
import { RestaurantListItemViewDto } from './restaurant-list-item.view-dto';

export const CATALOG_CARD_BRANCH_SELECT = {
  workingHours: true,
  hasDelivery: true,
  deliveryBaseFee: true,
  freeDeliveryMinOrder: true,
} as const satisfies Prisma.BranchSelect;

export type CatalogCardBranch = Prisma.BranchGetPayload<{
  select: typeof CATALOG_CARD_BRANCH_SELECT;
}>;

export type BrandWithCardBranches = Restaurant & {
  branches: CatalogCardBranch[];
};

export function toCatalogCard(
  brand: BrandWithCardBranches,
  now: Date,
): RestaurantListItemViewDto {
  return RestaurantListItemViewDto.mapToView(brand, {
    isOpen: brand.branches.some(
      (branch) =>
        getOpenState(branch.workingHours, now, RESTAURANT_TIMEZONE).isOpen,
    ),
    ...deliveryPromise(
      brand.branches.map((branch) => ({
        hasDelivery: branch.hasDelivery,
        deliveryBaseFee: branch.deliveryBaseFee.toNumber(),
        freeDeliveryMinOrder: branch.freeDeliveryMinOrder?.toNumber() ?? null,
      })),
    ),
  });
}
