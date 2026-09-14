import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useSessionStore } from '@/entities/session';
import { ApiError } from '@/shared/api/api-error';
import { startConnectivityWatch } from '@/shared/api/connectivity';
import { useOrderLive } from '@/entities/order';
import { useDefaultAddress } from '@/features/address-input';
import { connectRealtime, disconnectRealtime } from '@/shared/api/realtime';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => startConnectivityWatch(), []);

  const restore = useSessionStore((state) => state.restore);
  useEffect(() => {
    void restore();
  }, [restore]);

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeConnection />
      {children}
    </QueryClientProvider>
  );
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function RealtimeConnection() {
  const status = useSessionStore((state) => state.status);

  useOrderLive();
  useDefaultAddress();

  useEffect(() => {
    if (status !== 'authenticated') {
      disconnectRealtime();
      return;
    }

    connectRealtime();

    return () => disconnectRealtime();
  }, [status]);

  return null;
}
