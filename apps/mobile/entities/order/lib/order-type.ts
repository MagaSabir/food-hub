import { OrderType } from '@foodhubme/shared';

export function orderTypeLabel(orderType: OrderType): string {
  switch (orderType) {
    case OrderType.DELIVERY:
      return 'Доставка';
    case OrderType.PICKUP:
      return 'Самовывоз';
    case OrderType.DINE_IN:
      return 'В ресторане';
  }
}
