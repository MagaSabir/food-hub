
export const RESTAURANT_TIMEZONE = 'Europe/Moscow';

export interface WorkingInterval {
  from: string;
  to: string;
}

export const WEEKDAYS = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type WorkingHours = Partial<Record<Weekday, WorkingInterval[]>>;

export interface RestaurantListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  cuisineTypes: string[];
  ratingFood: number;
  ratingDelivery: number;
  reviewsCount: number;
  isOpen: boolean;

  deliveryFeeFrom: number | null;

  deliversToAddress: boolean | null;

  distanceKm: number | null;

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
  workingHours: WorkingHours;
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
  photos: string[];
}

export interface AddFavoriteRequest {
  restaurantId: string;
}
