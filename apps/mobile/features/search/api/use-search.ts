import { useQuery } from '@tanstack/react-query';
import { SEARCH_MIN_QUERY_LENGTH, type SearchResults } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';

export function isSearchable(query: string): boolean {
  return query.trim().length >= SEARCH_MIN_QUERY_LENGTH;
}

export function useSearch(query: string) {
  const q = query.trim();

  return useQuery({
    queryKey: ['search', q],
    queryFn: () =>
      apiFetch<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
    enabled: isSearchable(q),
    placeholderData: (previous) => previous,
    staleTime: 60_000,
  });
}
