import { Role } from '../enums';

export const OTP_CODE_LENGTH = 5;

export type OtpChannelPreference = 'auto' | 'sms';

export interface OtpRequested {
  cooldownSec: number;
  expiresInSec: number;
}

export interface ClientAuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface AuthMe {
  id: string;
  role: Role;
  email: string | null;
  phone: string | null;
  name: string | null;
  restaurantId: string | null;
  branchId: string | null;
}
