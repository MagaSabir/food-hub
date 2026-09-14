import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateOrderRequest, OrderView } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: CreateOrderRequest) =>
      apiFetch<OrderView>('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });
}
