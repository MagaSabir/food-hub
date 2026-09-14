import { create } from 'zustand';
import type { ClientAuthTokens } from '@foodhubme/shared';
import { setAccessToken, setTokenRefresher } from '@/shared/api/auth-token';
import { connectRealtime, disconnectRealtime } from '@/shared/api/realtime';
import { env } from '@/shared/config/env';
import {
  clearTokens,
  loadTokens,
  saveTokens,
  type StoredTokens,
} from './session-storage';

export type AuthStatus = 'unknown' | 'guest' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  tokens: StoredTokens | null;
  restore: () => Promise<void>;
  signIn: (tokens: ClientAuthTokens) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<string | null>;
}

export const useSessionStore = create<AuthState>((set, get) => ({
  status: 'unknown',
  tokens: null,

  restore: async () => {
    const tokens = await loadTokens();
    setAccessToken(tokens?.accessToken ?? null);
    set({ tokens, status: tokens ? 'authenticated' : 'guest' });
  },

  signIn: async (tokens) => {
    const stored: StoredTokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
    await saveTokens(stored);
    setAccessToken(stored.accessToken);
    set({ tokens: stored, status: 'authenticated' });
  },

  signOut: async () => {
    await clearTokens();
    setAccessToken(null);
    disconnectRealtime();
    set({ tokens: null, status: 'guest' });
  },

  refresh: async () => {
    const refreshToken = get().tokens?.refreshToken;
    if (!refreshToken) return null;

    inFlight ??= exchange(refreshToken)
      .then(async (tokens) => {
        await get().signIn(tokens);
        connectRealtime();

        return tokens.accessToken;
      })
      .catch(async () => {
        await get().signOut();

        return null;
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  },
}));

let inFlight: Promise<string | null> | null = null;

async function exchange(refreshToken: string): Promise<ClientAuthTokens> {
  const response = await fetch(`${env.apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) throw new Error(`refresh: ${response.status}`);

  return response.json() as Promise<ClientAuthTokens>;
}

setTokenRefresher(() => useSessionStore.getState().refresh());
