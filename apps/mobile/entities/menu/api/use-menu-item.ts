import { useQuery } from '@tanstack/react-query';
import type { MenuItemDetails } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';

export function useMenuItem(id: string | null) {
  return useQuery({
    queryKey: ['menu-item', id],
    queryFn: () => apiFetch<MenuItemDetails>(`/menu-items/${id ?? ''}`),
    enabled: Boolean(id),
  });
}
