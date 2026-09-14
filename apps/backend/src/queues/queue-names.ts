export const QUEUES = {
  OTP_DELIVERY: 'otp-delivery',
  PUSH: 'push',
} as const;

export const JOBS = {
  SEND_OTP: 'send-otp',
  SEND_PUSH: 'send-push',
} as const;
