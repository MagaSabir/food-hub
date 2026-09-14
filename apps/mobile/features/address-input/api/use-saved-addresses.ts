import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SaveAddressRequest, UserAddressView } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';
import { useSessionStore } from '@/entities/session';

const ADDRESSES_KEY = ['addresses'] as const;

export function useSavedAddresses() {
  const status = useSessionStore((state) => state.status);

  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: () => apiFetch<UserAddressView[]>('/addresses'),
    enabled: status === 'authenticated',
  });
}

export function useSaveAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SaveAddressRequest) =>
      apiFetch<UserAddressView>('/addresses', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  });
}

export function useMakeAddressDefault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<UserAddressView>(`/addresses/${id}/default`, { method: 'PUT' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  });
}

export function useRemoveAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/addresses/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  });
}
