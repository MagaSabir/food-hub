import { useQuery } from '@tanstack/react-query';
import type { AuthMe } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';
import { useSessionStore } from '@/entities/session';

export function useMe() {
  const status = useSessionStore((state) => state.status);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiFetch<AuthMe>('/auth/me'),
    enabled: status === 'authenticated',
  });
}
