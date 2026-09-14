
import type { OrderStatus } from '../enums';

export const PUSH_DATA_TYPES = {
  ORDER_STATUS: 'order:status',
} as const;

export interface OrderStatusPushData {
  type: typeof PUSH_DATA_TYPES.ORDER_STATUS;
  orderId: string;
  status: OrderStatus;
}

export type PushData = OrderStatusPushData;

export type DevicePlatform = 'ios' | 'android';

export interface RegisterDeviceRequest {
  expoPushToken: string;
  platform?: DevicePlatform;
}
