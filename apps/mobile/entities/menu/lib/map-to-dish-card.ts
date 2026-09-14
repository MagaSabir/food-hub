import type { MenuItemListItem } from '@foodhubme/shared';
import type { DishCardProps } from '../ui/dish-card';

export interface DishCardData extends DishCardProps {
  hasRequiredModifiers: boolean;
}

export function mapMenuItemToCard(item: MenuItemListItem): DishCardData {
  return {
    id: item.id,
    name: item.name,
    composition: item.composition ?? item.description ?? '',
    price: item.price,
    oldPrice: item.oldPrice,
    imageUrl: item.photoUrl,
    isAvailable: item.isAvailable,
    hasRequiredModifiers: item.hasRequiredModifiers,
  };
}
