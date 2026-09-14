let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export type TokenRefresher = () => Promise<string | null>;

let refresher: TokenRefresher | null = null;

export function setTokenRefresher(fn: TokenRefresher | null): void {
  refresher = fn;
}

export function getTokenRefresher(): TokenRefresher | null {
  return refresher;
}
