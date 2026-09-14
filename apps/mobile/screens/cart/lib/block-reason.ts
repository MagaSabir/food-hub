import {
  OrderBlockReason,
  OrderType,
  type DeliveryQuote,
} from '@foodhubme/shared';
import { formatPrice } from '@/shared/lib/format-price';

export function blockReasonText(
  quote: DeliveryQuote,
  orderType: OrderType,
): string | null {
  if (quote.canOrder || quote.blockReason === null) return null;

  switch (quote.blockReason) {
    case OrderBlockReason.NO_BRANCH:
      return 'У заведения нет точки, которая примет такой заказ.';

    case OrderBlockReason.TYPE_UNAVAILABLE:
      return typeUnavailableText(orderType);

    case OrderBlockReason.TOO_FAR:
      return quote.distanceKm === null
        ? 'По этому адресу заведение не возит.'
        : `До вас ${quote.distanceKm.toFixed(1)} км — это дальше зоны доставки. Можно забрать заказ самому.`;

    case OrderBlockReason.CLOSED:
      return 'Заведение сейчас закрыто.';

    case OrderBlockReason.NOT_ACCEPTING:
      return 'Заведение временно не принимает заказы — на кухне завал.';

    case OrderBlockReason.MIN_ORDER:
      return `Минимальный заказ — ${formatPrice(quote.minOrderAmount)}. Добавьте ещё на ${formatPrice(quote.amountToMinOrder)}.`;
  }
}

function typeUnavailableText(orderType: OrderType): string {
  switch (orderType) {
    case OrderType.DELIVERY:
      return 'Это заведение не доставляет — выберите самовывоз.';
    case OrderType.PICKUP:
      return 'Отсюда нельзя забрать заказ самому.';
    case OrderType.DINE_IN:
      return 'Заказ в зале здесь не оформить.';
  }
}
