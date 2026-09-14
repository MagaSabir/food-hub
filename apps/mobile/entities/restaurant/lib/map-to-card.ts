import type { RestaurantListItem } from '@foodhubme/shared';
import { formatDistance } from '@/shared/lib/format-distance';
import type { RestaurantCardProps } from '../ui/restaurant-card';
import { deliveryLabel } from './delivery-label';

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function mapRestaurantToCard(
  item: RestaurantListItem,
): Omit<RestaurantCardProps, 'onPress'> {
  return {
    name: item.name,
    cuisine: item.cuisineTypes.map(capitalize).join(' • '),
    rating: item.ratingFood,
    reviewsCount: item.reviewsCount,
    logoUrl: item.logoUrl,
    imageUrl: item.coverUrl,
    delivery: deliveryLabel(item.deliveryFeeFrom, item.freeDeliveryFrom, {
      deliversToAddress: item.deliversToAddress,
      distanceKm: item.distanceKm,
    }),
    deliveryTime: '30–40 мин',
    distanceLabel:
      item.deliversToAddress === false && item.distanceKm !== null
        ? formatDistance(item.distanceKm)
        : null,
  };
}
