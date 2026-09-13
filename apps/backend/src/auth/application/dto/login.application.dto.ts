import { AuthScope } from '@foodhubme/shared';

export interface LoginApplicationDto {
  email: string;
  password: string;
  scope: AuthScope;
}
