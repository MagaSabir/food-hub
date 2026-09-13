import { AuthSubjectType } from './auth-subject';

export interface RefreshTokenPayload {
  sub: string;
  subjectType: AuthSubjectType;
  sessionId: string;
}

export interface SignedRefreshTokenPayload extends RefreshTokenPayload {
  jti: string;
  iat: number;
  exp: number;
}
