import type {
  OrderBlockReason,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from '../enums';

export const ORDER_LIMITS = {
  MAX_LINES: 50,
  MAX_QUANTITY_PER_LINE: 30,
  MAX_OPTIONS_PER_LINE: 20,
  MAX_COMMENT_LENGTH: 500,
  MAX_ADDRESS_LENGTH: 300,
  MAX_ADDRESS_DETAILS_LENGTH: 200,
} as const;

export interface CreateOrderItemRequest {
  menuItemId: string;
  quantity: number;
  optionIds?: string[];
}

export interface DeliveryAddressRequest {
  address: string;
  details?: string;
  latitude: number;
  longitude: number;
}

export interface CreateOrderRequest {
  restaurantId: string;
  branchId?: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  items: CreateOrderItemRequest[];
  delivery?: DeliveryAddressRequest;
  contactPhone?: string;
  comment?: string;
}

export type DeliveryQuoteRequest = Omit<
  CreateOrderRequest,
  'paymentMethod' | 'contactPhone' | 'comment'
>;

export interface DeliveryQuote {
  canOrder: boolean;
  blockReason: OrderBlockReason | null;
  branchId: string | null;
  branchAddress: string | null;
  closesAt: string | null;
  distanceKm: number | null;
  itemsTotal: number;
  deliveryFee: number;
  isDeliveryFree: boolean;
  total: number;
  minOrderAmount: number;
  amountToMinOrder: number;
  amountToFreeDelivery: number | null;
}

export interface OrderModifierView {
  groupName: string;
  optionName: string;
  priceDelta: number;
}

export interface OrderItemView {
  id: string;
  menuItemId: string | null;
  name: string;
  photoUrl: string | null;
  basePrice: number;
  quantity: number;
  lineTotal: number;
  modifiers: OrderModifierView[];
}

export interface OrderView {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  orderType: OrderType;
  createdAt: string;

  restaurantId: string;
  restaurantName: string;
  branchId: string;
  branchAddress: string;

  deliveryAddress: string | null;
  deliveryDetails: string | null;
  distanceKm: number | null;

  contactPhone: string;
  comment: string | null;

  itemsTotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  prepMinutes: number | null;

  cancelReason: string | null;

  items: OrderItemView[];
}

export interface OrderListItemView {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  orderType: OrderType;
  createdAt: string;

  restaurantId: string;
  restaurantName: string;
  branchAddress: string;

  itemsCount: number;
  total: number;
}

export interface RestaurantOrderListItemView {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  orderType: OrderType;
  createdAt: string;

  branchId: string;
  branchAddress: string;

  deliveryAddress: string | null;

  itemsCount: number;
  total: number;
}
