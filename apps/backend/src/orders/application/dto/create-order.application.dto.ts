import { OrderType, PaymentMethod } from '@foodhubme/shared';

export interface CreateOrderItemDto {
  menuItemId: string;
  quantity: number;
  optionIds: string[];
}

export interface CreateOrderDeliveryDto {
  address: string;
  details: string | null;
  latitude: number;
  longitude: number;
}

export interface CreateOrderDto {
  userId: string;
  restaurantId: string;
  branchId: string | null;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  items: CreateOrderItemDto[];
  delivery: CreateOrderDeliveryDto | null;
  contactPhone: string | null;
  comment: string | null;
}
