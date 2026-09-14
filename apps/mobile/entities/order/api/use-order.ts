import { useQuery } from '@tanstack/react-query';
import type { OrderView } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiFetch<OrderView>(`/orders/${orderId}`),
    enabled: Boolean(orderId),
    staleTime: 30 * 1000,
  });
}
