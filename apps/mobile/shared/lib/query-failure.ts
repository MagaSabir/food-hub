import { NetworkError } from '@/shared/api/network-error';

const OFFLINE = new NetworkError('offline');

interface QueryLike {
  isPending: boolean;
  isPaused: boolean;
  isError: boolean;
  error: Error | null;
}

export function queryFailure(query: QueryLike): Error | null {
  if (query.isError) return query.error;
  if (query.isPending && query.isPaused) return OFFLINE;
  return null;
}
