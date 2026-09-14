import type { ItemType, ModifierType } from '../enums';

export interface MenuItemListItem {
  id: string;
  name: string;
  description: string | null;
  composition: string | null;
  itemType: ItemType;
  weight: string | null;
  volume: string | null;
  calories: number | null;
  price: number;
  oldPrice: number | null;
  photoUrl: string | null;
  isAvailable: boolean;
  hasModifiers: boolean;
  hasRequiredModifiers: boolean;
}

export interface MenuCategoryWithItems {
  id: string;
  name: string;
  items: MenuItemListItem[];
}

export interface ModifierOptionInfo {
  id: string;
  name: string;
  priceDelta: number;
  isAvailable: boolean;
}

export interface ModifierGroupInfo {
  id: string;
  name: string;
  type: ModifierType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number | null;
  options: ModifierOptionInfo[];
}

export interface MenuItemDetails extends MenuItemListItem {
  photos: string[];
  modifierGroups: ModifierGroupInfo[];
}
