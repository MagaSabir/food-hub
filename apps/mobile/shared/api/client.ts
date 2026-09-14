import type { ErrorCode } from '@foodhubme/shared';
import { env } from '@/shared/config/env';
import { ApiError } from '@/shared/api/api-error';
import { getAccessToken, getTokenRefresher } from '@/shared/api/auth-token';
import { isOnlineNow } from '@/shared/api/connectivity';
import { NetworkError } from '@/shared/api/network-error';

interface ErrorBody {
  message?: string | string[];
  code?: ErrorCode;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await send(path, init, getAccessToken());

  if (response.status === 401) {
    const retried = await retryWithFreshToken<T>(path, init);
    if (retried !== NOT_RETRIED) return retried as T;
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

const NOT_RETRIED = Symbol('not-retried');

async function retryWithFreshToken<T>(
  path: string,
  init?: RequestInit,
): Promise<T | typeof NOT_RETRIED> {
  if (getAccessToken() === null) return NOT_RETRIED;

  const refresh = getTokenRefresher();
  if (refresh === null) return NOT_RETRIED;

  const token = await refresh();
  if (token === null) return NOT_RETRIED;

  const response = await send(path, init, token);

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

const REQUEST_TIMEOUT_MS = 15_000;

async function send(
  path: string,
  init: RequestInit | undefined,
  token: string | null,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${env.apiUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    throw toNetworkError(error);
  } finally {
    clearTimeout(timer);
  }
}

function toNetworkError(error: unknown): NetworkError {
  if (error instanceof Error && error.name === 'AbortError') {
    return new NetworkError('timeout', error);
  }

  return new NetworkError(isOnlineNow() ? 'unreachable' : 'offline', error);
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ErrorBody;
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message;

    return new ApiError(
      response.status,
      body.code,
      message ?? `API ${response.status}`,
    );
  } catch {
    return new ApiError(response.status, undefined, `API ${response.status}`);
  }
}
