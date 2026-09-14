import { Prisma } from '@prisma/client';

export interface DeliveryPricing {
  deliveryBaseFee: Prisma.Decimal;
  deliveryIncludedRadiusKm: Prisma.Decimal;
  deliveryPerKm: Prisma.Decimal;
  deliveryMaxRadiusKm: Prisma.Decimal | null;
  freeDeliveryMinOrder: Prisma.Decimal | null;
  freeDeliveryRadiusKm: Prisma.Decimal | null;
}

export type DeliveryFeeResult =
  | { deliverable: false }
  | { deliverable: true; fee: Prisma.Decimal; isFree: boolean };

function roundUpToRuble(value: Prisma.Decimal): Prisma.Decimal {
  return value.ceil();
}

export function calculateDeliveryFee(
  pricing: DeliveryPricing,
  distanceKm: number,
  itemsTotal: Prisma.Decimal,
): DeliveryFeeResult {
  const distance = new Prisma.Decimal(distanceKm);

  if (
    pricing.deliveryMaxRadiusKm !== null &&
    distance.gt(pricing.deliveryMaxRadiusKm)
  ) {
    return { deliverable: false };
  }

  if (
    pricing.freeDeliveryMinOrder !== null &&
    itemsTotal.gte(pricing.freeDeliveryMinOrder) &&
    (pricing.freeDeliveryRadiusKm === null ||
      distance.lte(pricing.freeDeliveryRadiusKm))
  ) {
    return { deliverable: true, fee: new Prisma.Decimal(0), isFree: true };
  }

  const fee = regularFee(pricing, distance);

  return { deliverable: true, fee, isFree: fee.isZero() };
}

function regularFee(
  pricing: DeliveryPricing,
  distance: Prisma.Decimal,
): Prisma.Decimal {
  const extraKm = distance.minus(pricing.deliveryIncludedRadiusKm);
  const extraFee = extraKm.isPositive()
    ? extraKm.mul(pricing.deliveryPerKm)
    : new Prisma.Decimal(0);

  return roundUpToRuble(pricing.deliveryBaseFee.plus(extraFee));
}

export function amountToFreeDelivery(
  pricing: DeliveryPricing,
  distanceKm: number,
  itemsTotal: Prisma.Decimal,
): Prisma.Decimal | null {
  if (pricing.freeDeliveryMinOrder === null) return null;

  const distance = new Prisma.Decimal(distanceKm);

  if (regularFee(pricing, distance).isZero()) return null;

  if (
    pricing.freeDeliveryRadiusKm !== null &&
    distance.gt(pricing.freeDeliveryRadiusKm)
  ) {
    return null;
  }

  const left = pricing.freeDeliveryMinOrder.minus(itemsTotal);
  return left.isPositive() ? left : new Prisma.Decimal(0);
}
