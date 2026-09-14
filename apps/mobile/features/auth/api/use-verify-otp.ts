import { useMutation } from '@tanstack/react-query';
import type { ClientAuthTokens } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';
import { useSessionStore } from '@/entities/session';

export function useVerifyOtp() {
  const signIn = useSessionStore((state) => state.signIn);

  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      apiFetch<ClientAuthTokens>('/auth/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      }),
    onSuccess: (tokens) => signIn(tokens),
  });
}
