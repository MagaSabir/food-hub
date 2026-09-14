
export interface RestaurantListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  cuisineTypes: string[];
  ratingFood: number;
  ratingDelivery: number;
  reviewsCount: number;
  isOpen: boolean;

  deliveryFeeFrom: number | null;

  freeDeliveryFrom: number | null;
}

export interface BranchInfo {
  id: string;
  name: string | null;
  address: string;
  phone: string;
  cityName: string;
  latitude: number | null;
  longitude: number | null;
  isOpen: boolean;
  closesAt: string | null;
  acceptingOrders: boolean;
  hasDelivery: boolean;
  hasPickup: boolean;
  hasDineIn: boolean;
  minOrderAmount: number;
  deliveryBaseFee: number;
  freeDeliveryMinOrder: number | null;
}

export interface RestaurantDetails extends RestaurantListItem {
  branches: BranchInfo[];
}

export interface AddFavoriteRequest {
  restaurantId: string;
}
