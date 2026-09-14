import { OrderBlockReason, OrderType } from '@foodhubme/shared';
import { Prisma } from '@prisma/client';
import { getOpenState } from '../../../restaurants/domain/rules/working-hours';
import {
  calculateDeliveryFee,
  DeliveryPricing,
  DeliveryFeeResult,
} from './delivery-fee';
import { distanceKm, GeoPoint } from './distance';

export interface OrderableBranch extends DeliveryPricing {
  id: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  workingHours: unknown;
  isActive: boolean;
  acceptingOrders: boolean;
  hasDelivery: boolean;
  hasPickup: boolean;
  hasDineIn: boolean;
  minOrderAmount: Prisma.Decimal;
}

export interface PlacementInput {
  branches: OrderableBranch[];
  orderType: OrderType;
  destination: GeoPoint | null;
  requestedBranchId: string | null;
  itemsTotal: Prisma.Decimal;
  now: Date;
  timeZone: string;
}

export interface Placement {
  canOrder: boolean;
  blockReason: OrderBlockReason | null;
  branch: OrderableBranch | null;
  distanceKm: number | null;
  deliveryFee: Prisma.Decimal;
  closesAt: string | null;
}

const ZERO = new Prisma.Decimal(0);

const blocked = (
  reason: OrderBlockReason,
  branch: OrderableBranch | null = null,
  distance: number | null = null,
): Placement => ({
  canOrder: false,
  blockReason: reason,
  branch,
  distanceKm: distance,
  deliveryFee: ZERO,
  closesAt: null,
});

function supportsType(branch: OrderableBranch, orderType: OrderType): boolean {
  switch (orderType) {
    case OrderType.DELIVERY:
      return branch.hasDelivery;
    case OrderType.PICKUP:
      return branch.hasPickup;
    case OrderType.DINE_IN:
      return branch.hasDineIn;
  }
}

function currentBlock(
  branch: OrderableBranch,
  now: Date,
  timeZone: string,
): { reason: OrderBlockReason; closesAt: string | null } | null {
  const openState = getOpenState(branch.workingHours, now, timeZone);
  if (!openState.isOpen) {
    return { reason: OrderBlockReason.CLOSED, closesAt: null };
  }
  if (!branch.acceptingOrders) {
    return {
      reason: OrderBlockReason.NOT_ACCEPTING,
      closesAt: openState.closesAt,
    };
  }
  return null;
}

function placeDelivery(input: PlacementInput): Placement {
  const { branches, destination, now, timeZone } = input;

  const candidates = branches
    .filter((b) => b.isActive && b.hasDelivery)
    .filter((b) => b.latitude !== null && b.longitude !== null);

  if (candidates.length === 0 || destination === null) {
    const anyBranch = branches.some((b) => b.isActive);
    return blocked(
      anyBranch
        ? OrderBlockReason.TYPE_UNAVAILABLE
        : OrderBlockReason.NO_BRANCH,
    );
  }

  const measured = candidates
    .map((branch) => ({
      branch,
      distance: distanceKm(
        { latitude: branch.latitude!, longitude: branch.longitude! },
        destination,
      ),
    }))
    .sort((a, b) => a.distance - b.distance);

  const inRange = measured.filter(({ branch, distance }) => {
    const quote = calculateDeliveryFee(branch, distance, input.itemsTotal);
    return quote.deliverable;
  });

  if (inRange.length === 0) {
    return blocked(
      OrderBlockReason.TOO_FAR,
      measured[0].branch,
      measured[0].distance,
    );
  }

  for (const { branch, distance } of inRange) {
    const block = currentBlock(branch, now, timeZone);
    if (block !== null) continue;

    const quote = calculateDeliveryFee(
      branch,
      distance,
      input.itemsTotal,
    ) as Extract<DeliveryFeeResult, { deliverable: true }>;

    return {
      canOrder: true,
      blockReason: null,
      branch,
      distanceKm: distance,
      deliveryFee: quote.fee,
      closesAt: getOpenState(branch.workingHours, now, timeZone).closesAt,
    };
  }

  const nearest = inRange[0];
  const block = currentBlock(nearest.branch, now, timeZone)!;
  return blocked(block.reason, nearest.branch, nearest.distance);
}

function placeSelfService(input: PlacementInput): Placement {
  const { branches, requestedBranchId, orderType, now, timeZone } = input;

  const branch = branches.find((b) => b.id === requestedBranchId);
  if (!branch || !branch.isActive) return blocked(OrderBlockReason.NO_BRANCH);

  if (!supportsType(branch, orderType)) {
    return blocked(OrderBlockReason.TYPE_UNAVAILABLE, branch);
  }

  const block = currentBlock(branch, now, timeZone);
  if (block !== null) return blocked(block.reason, branch);

  return {
    canOrder: true,
    blockReason: null,
    branch,
    distanceKm: null,
    deliveryFee: ZERO,
    closesAt: getOpenState(branch.workingHours, now, timeZone).closesAt,
  };
}

export function resolveOrderPlacement(input: PlacementInput): Placement {
  const placement =
    input.orderType === OrderType.DELIVERY
      ? placeDelivery(input)
      : placeSelfService(input);

  if (!placement.canOrder || placement.branch === null) return placement;

  if (input.itemsTotal.lt(placement.branch.minOrderAmount)) {
    return {
      ...placement,
      canOrder: false,
      blockReason: OrderBlockReason.MIN_ORDER,
    };
  }

  return placement;
}
