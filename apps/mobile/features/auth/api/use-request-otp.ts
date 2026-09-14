import { useMutation } from '@tanstack/react-query';
import type { OtpRequested } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';

export function useRequestOtp() {
  return useMutation({
    mutationFn: (phone: string) =>
      apiFetch<OtpRequested>('/auth/phone/request', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }),
  });
}
