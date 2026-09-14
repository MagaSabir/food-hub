import type { BranchInfo, RestaurantDetails } from '@foodhubme/shared';

export function pickBranch(restaurant: RestaurantDetails): BranchInfo | null {
  return restaurant.branches[0] ?? null;
}

export function formatCuisines(cuisineTypes: string[]): string {
  return cuisineTypes.join(' • ');
}

export function formatOpenUntil(branch: BranchInfo | null): string {
  if (!branch?.isOpen) return 'Закрыто';
  return branch.closesAt ? `до ${branch.closesAt}` : 'Открыто';
}

export function averageRating(
  ratingFood: number,
  ratingDelivery: number,
): number {
  return Math.round(((ratingFood + ratingDelivery) / 2) * 10) / 10;
}
