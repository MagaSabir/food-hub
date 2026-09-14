import { OTP_CODE_LENGTH } from '@foodhubme/shared';

export const OtpPolicy = {
  CODE_LENGTH: OTP_CODE_LENGTH,

  TTL_SEC: 5 * 60,

  LIVE_CODES: 2,

  COOLDOWN_SEC: 60,

  MAX_PER_HOUR: 5,

  HOUR_SEC: 60 * 60,

  MAX_ATTEMPTS: 5,

  DELIVERY_ATTEMPTS: 3,
  DELIVERY_BACKOFF_MS: 5000,
} as const;
