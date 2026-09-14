import { OrderStatus, OrderType } from '@foodhubme/shared';

export interface OrderPushText {
  title: string;
  body: string;
}

export function orderStatusPush(order: {
  orderNumber: number;
  type: OrderType;
  status: OrderStatus;
  prepMinutes: number | null;
  cancelReason: string | null;
}): OrderPushText | null {
  const number = `Заказ №${order.orderNumber}`;

  switch (order.status) {
    case OrderStatus.ACCEPTED:
      return {
        title: `${number} принят`,
        body:
          order.prepMinutes === null
            ? 'Ресторан принял заказ и начал готовить'
            : `Готовим — будет готов примерно через ${minutes(order.prepMinutes)}`,
      };

    case OrderStatus.READY:
      return {
        title: `${number} готов`,
        body:
          order.type === OrderType.PICKUP
            ? 'Можно забирать'
            : 'Сейчас принесут',
      };

    case OrderStatus.ON_THE_WAY:
      return {
        title: `${number} в пути`,
        body: 'Курьер выехал к вам',
      };

    case OrderStatus.CANCELLED:
      return {
        title: `${number} отклонён`,
        body: order.cancelReason ?? 'Ресторан не смог принять заказ',
      };

    default:
      return null;
  }
}

function minutes(n: number): string {
  const last = n % 10;
  const twoLast = n % 100;

  if (twoLast >= 11 && twoLast <= 14) return `${n} минут`;
  if (last === 1) return `${n} минуту`;
  if (last >= 2 && last <= 4) return `${n} минуты`;

  return `${n} минут`;
}
