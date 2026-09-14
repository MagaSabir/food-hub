import { OtpChannelPreference } from '@foodhubme/shared';

export interface IOtpSender {
  send(
    phone: string,
    code: string,
    preference: OtpChannelPreference,
  ): Promise<void>;
}

export type OtpChannelName = 'telegram' | 'sms';

export interface IOtpChannel {
  readonly name: OtpChannelName;

  send(phone: string, code: string): Promise<boolean>;
}

export const OTP_SENDER = Symbol('OTP_SENDER');
export const OTP_CHANNEL = Symbol('OTP_CHANNEL');
export const OTP_CHANNELS = Symbol('OTP_CHANNELS');
