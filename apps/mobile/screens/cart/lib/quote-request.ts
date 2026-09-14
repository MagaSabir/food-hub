import { OrderType, type DeliveryQuoteRequest } from '@foodhubme/shared';
import { fullAddress, type DeliveryAddress } from '@/features/address-input';
import type { CartLine } from '@/features/cart';

interface QuoteInput {
  restaurantId: string | undefined;
  orderType: OrderType;
  branchId: string | null;
  address: DeliveryAddress | null;
  lines: CartLine[];
}

export function buildQuoteRequest({
  restaurantId,
  orderType,
  branchId,
  address,
  lines,
}: QuoteInput): DeliveryQuoteRequest | null {
  if (!restaurantId || lines.length === 0) return null;

  const items = lines.map((line) => ({
    menuItemId: line.dishId,
    quantity: line.quantity,
    optionIds: line.options.map((option) => option.id),
  }));

  if (orderType === OrderType.DELIVERY) {
    if (address === null) return null;

    return {
      restaurantId,
      orderType,
      items,
      delivery: {
        address: fullAddress(address),
        ...(address.details ? { details: address.details } : {}),
        latitude: address.latitude,
        longitude: address.longitude,
      },
    };
  }

  if (!branchId) return null;

  return { restaurantId, orderType, branchId, items };
}
