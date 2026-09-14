import { OrderStatus, OrderType } from '@foodhubme/shared';

export interface TrackerStep {
  key: string;
  label: string;
  statuses: OrderStatus[];
}

export function trackerSteps(orderType: OrderType): TrackerStep[] {
  const isDelivery = orderType === OrderType.DELIVERY;

  return [
    {
      key: 'placed',
      label: 'Оформлен',
      statuses: [OrderStatus.PENDING],
    },
    {
      key: 'cooking',
      label: 'Готовится',
      statuses: [OrderStatus.ACCEPTED, OrderStatus.PREPARING],
    },
    {
      key: 'handoff',
      label: isDelivery ? 'В пути' : 'Готов',
      statuses: [OrderStatus.ON_THE_WAY, OrderStatus.READY],
    },
    {
      key: 'done',
      label: isDelivery ? 'Доставлен' : 'Выдан',
      statuses: [OrderStatus.COMPLETED],
    },
  ];
}

export function currentStepIndex(
  steps: TrackerStep[],
  status: OrderStatus,
): number {
  const index = steps.findIndex((step) => step.statuses.includes(status));

  return index === -1 ? 0 : index;
}
