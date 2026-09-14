import type { Role } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  restaurantId?: string;
  branchId?: string | null;
}
