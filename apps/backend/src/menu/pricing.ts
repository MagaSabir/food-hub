import type { Prisma } from '@prisma/client';

export interface EffectivePrice {
  price: Prisma.Decimal;
  oldPrice: Prisma.Decimal | null;
}

export interface PricedItem {
  price: Prisma.Decimal;
  discountPrice: Prisma.Decimal | null;
  discountUntil: Date | null;
}

export function getEffectivePrice(item: PricedItem, now: Date): EffectivePrice {
  const { price, discountPrice, discountUntil } = item;

  if (discountPrice === null) return { price, oldPrice: null };

  if (discountUntil !== null && discountUntil.getTime() <= now.getTime()) {
    return { price, oldPrice: null };
  }

  if (discountPrice.gte(price)) return { price, oldPrice: null };

  return { price: discountPrice, oldPrice: price };
}
