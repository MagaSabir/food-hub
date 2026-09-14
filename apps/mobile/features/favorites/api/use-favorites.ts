import { useQuery } from '@tanstack/react-query';
import type { RestaurantListItem } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';
import { useSessionStore } from '@/entities/session';

export const FAVORITES_KEY = ['favorites'] as const;

export function useFavorites() {
  const status = useSessionStore((state) => state.status);

  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: () => apiFetch<RestaurantListItem[]>('/favorites'),
    enabled: status === 'authenticated',
  });
}

export function useFavoriteIds(): Set<string> {
  const { data } = useFavorites();

  return new Set((data ?? []).map((item) => item.id));
}
