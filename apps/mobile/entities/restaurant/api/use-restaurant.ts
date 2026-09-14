import { useQuery } from '@tanstack/react-query';
import type { RestaurantDetails } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';

export function useRestaurant(slug: string) {
  return useQuery({
    queryKey: ['restaurant', slug],
    queryFn: () =>
      apiFetch<RestaurantDetails>(
        `/restaurants/by-slug/${encodeURIComponent(slug)}`,
      ),
    enabled: Boolean(slug),
  });
}
