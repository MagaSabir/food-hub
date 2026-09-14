import { Role } from '@prisma/client';
import { AccessTokenPayload } from '../auth/domain/types/access-token-payload';

export function clientRoom(userId: string): string {
  return `user:${userId}`;
}

export function branchRoom(branchId: string): string {
  return `branch:${branchId}`;
}

export function restaurantRoom(restaurantId: string): string {
  return `restaurant:${restaurantId}`;
}

export function roomsForConnection(user: AccessTokenPayload): string[] {
  switch (user.role) {
    case Role.CLIENT:
      return [clientRoom(user.sub)];

    case Role.RESTAURANT_OWNER:
    case Role.RESTAURANT_STAFF:
      if (user.branchId) return [branchRoom(user.branchId)];
      return user.restaurantId ? [restaurantRoom(user.restaurantId)] : [];

    default:
      return [];
  }
}

export function roomsForBranchOrder(
  restaurantId: string,
  branchId: string,
): string[] {
  return [branchRoom(branchId), restaurantRoom(restaurantId)];
}
