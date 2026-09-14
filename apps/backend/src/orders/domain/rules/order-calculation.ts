import { OrderType } from '@foodhubme/shared';
import { Prisma } from '@prisma/client';
import { RestaurantNotFoundError } from '../../../restaurants/domain/errors/restaurants.errors';
import { amountToFreeDelivery } from './delivery-fee';
import { GeoPoint } from './distance';
import {
  calculateOrderItems,
  OrderableItem,
  OrderLineSnapshot,
  RequestedLine,
} from './order-lines';
import {
  OrderableBranch,
  Placement,
  resolveOrderPlacement,
} from './order-placement';

export interface OrderContext {
  restaurant: { id: string; name: string } | null;
  branches: OrderableBranch[];
  items: OrderableItem[];
}

export interface OrderCalculationRequest {
  restaurantId: string;
  orderType: OrderType;
  branchId: string | null;
  items: RequestedLine[];
  delivery: GeoPoint | null;
}

export interface OrderCalculation {
  lines: OrderLineSnapshot[];
  itemsTotal: Prisma.Decimal;
  placement: Placement;
  amountToFreeDelivery: Prisma.Decimal | null;
}

export function calculateOrder(
  context: OrderContext,
  request: OrderCalculationRequest,
  now: Date,
  timeZone: string,
): OrderCalculation {
  if (context.restaurant === null) {
    throw new RestaurantNotFoundError(request.restaurantId);
  }

  const { lines, itemsTotal } = calculateOrderItems(
    request.items,
    context.items,
    now,
  );

  const placement = resolveOrderPlacement({
    branches: context.branches,
    orderType: request.orderType,
    destination: request.delivery,
    requestedBranchId: request.branchId,
    itemsTotal,
    now,
    timeZone,
  });

  const toFree =
    request.orderType === OrderType.DELIVERY &&
    placement.branch !== null &&
    placement.distanceKm !== null
      ? amountToFreeDelivery(placement.branch, placement.distanceKm, itemsTotal)
      : null;

  return { lines, itemsTotal, placement, amountToFreeDelivery: toFree };
}
