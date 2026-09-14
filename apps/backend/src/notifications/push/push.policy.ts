export const PushPolicy = {
  DELIVERY_ATTEMPTS: 3,

  DELIVERY_BACKOFF_MS: 1_000,

  TTL_SECONDS: 30 * 60,
} as const;
