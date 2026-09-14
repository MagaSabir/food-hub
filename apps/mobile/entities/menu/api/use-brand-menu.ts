import { useQuery } from '@tanstack/react-query';
import type { MenuCategoryWithItems } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';

export function useBrandMenu(slug: string) {
  return useQuery({
    queryKey: ['menu', slug],
    queryFn: () =>
      apiFetch<MenuCategoryWithItems[]>(
        `/restaurants/by-slug/${encodeURIComponent(slug)}/menu`,
      ),
    enabled: Boolean(slug),
  });
}
