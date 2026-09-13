export enum AuthSubjectType {
  STAFF = 'staff',
  ADMIN = 'admin',
  CLIENT = 'client',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTtlSec: number;
}
