import { OrderStatus, OrderType } from '@foodhubme/shared';

const FLOW: Record<OrderType, readonly OrderStatus[]> = {
  [OrderType.DELIVERY]: [
    OrderStatus.PENDING,
    OrderStatus.ACCEPTED,
    OrderStatus.PREPARING,
    OrderStatus.ON_THE_WAY,
    OrderStatus.COMPLETED,
  ],
  [OrderType.PICKUP]: [
    OrderStatus.PENDING,
    OrderStatus.ACCEPTED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.COMPLETED,
  ],
  [OrderType.DINE_IN]: [
    OrderStatus.PENDING,
    OrderStatus.ACCEPTED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.COMPLETED,
  ],
};

export function isFinalStatus(status: OrderStatus): boolean {
  return status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED;
}

export function canTransition(
  orderType: OrderType,
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (isFinalStatus(from)) return false;

  if (to === OrderStatus.CANCELLED) return true;

  const flow = FLOW[orderType];
  const at = flow.indexOf(from);

  return at !== -1 && flow[at + 1] === to;
}

export function nextStatus(
  orderType: OrderType,
  from: OrderStatus,
): OrderStatus | null {
  if (isFinalStatus(from)) return null;

  const flow = FLOW[orderType];
  const at = flow.indexOf(from);

  return at === -1 ? null : (flow[at + 1] ?? null);
}

export function hasReached(
  orderType: OrderType,
  current: OrderStatus,
  target: OrderStatus,
): boolean {
  if (current === target) return true;
  if (current === OrderStatus.CANCELLED || target === OrderStatus.CANCELLED) {
    return false;
  }

  const flow = FLOW[orderType];
  const at = flow.indexOf(current);
  const to = flow.indexOf(target);

  return at !== -1 && to !== -1 && to < at;
}
