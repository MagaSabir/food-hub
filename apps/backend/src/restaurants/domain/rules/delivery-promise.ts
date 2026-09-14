export interface DeliveryPromiseBranch {
  hasDelivery: boolean;
  deliveryBaseFee: number;
  freeDeliveryMinOrder: number | null;
}

export interface DeliveryPromise {
  deliveryFeeFrom: number | null;
  freeDeliveryFrom: number | null;
}

export function deliveryPromise(
  branches: DeliveryPromiseBranch[],
): DeliveryPromise {
  const delivering = branches.filter((branch) => branch.hasDelivery);

  if (delivering.length === 0) {
    return { deliveryFeeFrom: null, freeDeliveryFrom: null };
  }

  const thresholds = delivering
    .map((branch) => branch.freeDeliveryMinOrder)
    .filter((value): value is number => value !== null);

  return {
    deliveryFeeFrom: Math.min(...delivering.map((b) => b.deliveryBaseFee)),
    freeDeliveryFrom: thresholds.length > 0 ? Math.min(...thresholds) : null,
  };
}
