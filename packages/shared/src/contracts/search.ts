
import type { MenuItemListItem } from './menu';
import type { RestaurantListItem } from './restaurant';

export interface SearchDishRestaurant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface SearchDishItem extends MenuItemListItem {
  restaurant: SearchDishRestaurant;
}

export interface SearchResults {
  restaurants: RestaurantListItem[];
  dishes: SearchDishItem[];
}

export const SEARCH_MIN_QUERY_LENGTH = 2;
