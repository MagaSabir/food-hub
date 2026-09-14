
import type { OrderStatus } from '../enums';

export const WS_NAMESPACES = {
  CLIENT: '/ws/client',
  RESTAURANT: '/ws/restaurant',
} as const;

export type WsNamespace = (typeof WS_NAMESPACES)[keyof typeof WS_NAMESPACES];

export interface WsConnectErrorData {
  code: string;
}

export const WS_EVENTS = {
  ORDER_NEW: 'order:new',

  ORDER_UPDATED: 'order:updated',

  ORDER_STATUS: 'order:status',
} as const;

export interface NewOrderEvent {
  orderId: string;
  orderNumber: number;
  branchId: string;
  createdAt: string;
}

export interface OrderStatusEvent {
  orderId: string;
  orderNumber: number;
  status: OrderStatus;
  prepMinutes: number | null;
  cancelReason: string | null;
}

export interface OrderUpdatedEvent {
  orderId: string;
  orderNumber: number;
  branchId: string;
  status: OrderStatus;
}
