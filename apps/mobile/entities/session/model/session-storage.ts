import * as SecureStore from 'expo-secure-store';
import type { ClientAuthTokens } from '@foodhubme/shared';

const ACCESS_KEY = 'foodhub.accessToken';
const REFRESH_KEY = 'foodhub.refreshToken';

export type StoredTokens = Pick<
  ClientAuthTokens,
  'accessToken' | 'refreshToken'
>;

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);

  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
