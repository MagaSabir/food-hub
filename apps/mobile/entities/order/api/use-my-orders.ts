import { useQuery } from '@tanstack/react-query';
import type { OrderListItemView } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';

export function useMyOrders(enabled: boolean) {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: () => apiFetch<OrderListItemView[]>('/orders/mine'),
    enabled,
    staleTime: 30 * 1000,
  });
}
