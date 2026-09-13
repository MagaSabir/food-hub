import { AuthSubjectType } from './auth-subject';

export type RefreshTokenSource = 'cookie' | 'body';

export interface RefreshSession {
  subjectId: string;
  subjectType: AuthSubjectType;
  sessionId: string;
  token: string;
  source: RefreshTokenSource;
}
