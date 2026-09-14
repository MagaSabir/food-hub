import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AuthMe, UpdateProfileRequest } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateProfileRequest) =>
      apiFetch<AuthMe>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: (me) => queryClient.setQueryData(['auth', 'me'], me),
  });
}
