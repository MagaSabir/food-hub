import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DeliveryQuote, DeliveryQuoteRequest } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';

export function useDeliveryQuote(request: DeliveryQuoteRequest | null) {
  return useQuery({
    queryKey: ['delivery-quote', request],
    queryFn: () =>
      apiFetch<DeliveryQuote>('/orders/quote', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    enabled: request !== null,
    placeholderData: request === null ? undefined : keepPreviousData,
    staleTime: 0,
  });
}
