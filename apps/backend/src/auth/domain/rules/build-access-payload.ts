import { Role } from '@prisma/client';
import type { PlatformAdmin, StaffUser, User } from '@prisma/client';
import { AccessTokenPayload } from '../types/access-token-payload';

export function staffAccessPayload(staff: StaffUser): AccessTokenPayload {
  return {
    sub: staff.id,
    role: staff.role,
    restaurantId: staff.restaurantId,
    branchId: staff.branchId,
  };
}

export function clientAccessPayload(user: User): AccessTokenPayload {
  return { sub: user.id, role: Role.CLIENT };
}

export function adminAccessPayload(admin: PlatformAdmin): AccessTokenPayload {
  return { sub: admin.id, role: Role.PLATFORM_ADMIN };
}
