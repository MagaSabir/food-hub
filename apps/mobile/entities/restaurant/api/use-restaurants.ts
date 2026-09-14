import { useQuery } from '@tanstack/react-query';
import type { CatalogSort, RestaurantListItem } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';

export interface CatalogFilters {
  sort?: CatalogSort;
  cuisine?: string;
  open?: boolean;
  latitude?: number;
  longitude?: number;
}

function toQuery(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.cuisine) params.set('cuisine', filters.cuisine);
  if (filters.open) params.set('open', 'true');
  if (filters.latitude !== undefined && filters.longitude !== undefined) {
    params.set('lat', String(filters.latitude));
    params.set('lng', String(filters.longitude));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function useRestaurants(filters: CatalogFilters = {}) {
  return useQuery({
    queryKey: ['restaurants', filters],
    queryFn: () =>
      apiFetch<RestaurantListItem[]>(`/restaurants${toQuery(filters)}`),
    placeholderData: (previous) => previous,
  });
}
