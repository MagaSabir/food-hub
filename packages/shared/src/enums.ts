
export enum Role {
  CLIENT = 'CLIENT',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  RESTAURANT_STAFF = 'RESTAURANT_STAFF',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
}

export enum AuthScope {
  RESTAURANT = 'restaurant',
  PLATFORM = 'platform',
}

export enum CatalogSort {
  NAME = 'name',
  RATING = 'rating',
  REVIEWS = 'reviews',
  DELIVERY = 'delivery',
}

export enum ItemType {
  DISH = 'DISH',
  DRINK = 'DRINK',
}

export enum ModifierType {
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPLE',
}

export enum OrderType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  DINE_IN = 'DINE_IN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  ON_THE_WAY = 'ON_THE_WAY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderBlockReason {
  NO_BRANCH = 'NO_BRANCH',
  TYPE_UNAVAILABLE = 'TYPE_UNAVAILABLE',
  TOO_FAR = 'TOO_FAR',
  CLOSED = 'CLOSED',
  NOT_ACCEPTING = 'NOT_ACCEPTING',
  MIN_ORDER = 'MIN_ORDER',
}

export enum PaymentMethod {
  CASH = 'CASH',
  ONLINE = 'ONLINE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  HELD = 'HELD',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}
