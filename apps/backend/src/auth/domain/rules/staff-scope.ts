import { AccessTokenPayload } from '../types/access-token-payload';
import { InvalidAccessTokenError } from '../errors/auth.errors';

export interface StaffScope {
  restaurantId: string;
  branchId: string | null;
}

export function staffScope(user: AccessTokenPayload): StaffScope {
  if (!user.restaurantId) {
    throw new InvalidAccessTokenError();
  }

  return {
    restaurantId: user.restaurantId,
    branchId: user.branchId ?? null,
  };
}
