import { OrderStatus, OrderType } from '@foodhubme/shared';

export interface OrderStatusView {
  label: string;
  tone: 'neutral' | 'active' | 'done' | 'cancelled';
}

export function orderStatusView(
  status: OrderStatus,
  orderType: OrderType,
): OrderStatusView {
  const isDelivery = orderType === OrderType.DELIVERY;

  switch (status) {
    case OrderStatus.PENDING:
      return { label: 'Ждём подтверждения ресторана', tone: 'neutral' };
    case OrderStatus.ACCEPTED:
      return { label: 'Ресторан принял заказ', tone: 'active' };
    case OrderStatus.PREPARING:
      return { label: 'Готовится', tone: 'active' };
    case OrderStatus.READY:
      return {
        label: isDelivery ? 'Готов, ждёт курьера' : 'Готов — можно забирать',
        tone: 'active',
      };
    case OrderStatus.ON_THE_WAY:
      return { label: 'В пути', tone: 'active' };
    case OrderStatus.COMPLETED:
      return { label: 'Завершён', tone: 'done' };
    case OrderStatus.CANCELLED:
      return { label: 'Отменён', tone: 'cancelled' };
  }
}

export const STATUS_TONE_CLASS: Record<OrderStatusView['tone'], string> = {
  neutral: 'text-ink-secondary',
  active: 'text-primary-600',
  done: 'text-ink',
  cancelled: 'text-error',
};
