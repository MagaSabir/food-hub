import { Prisma } from '@prisma/client';
import { StaffScope } from '../../../auth/domain/rules/staff-scope';

export function staffScopeWhere(scope: StaffScope): Prisma.OrderWhereInput {
  return {
    restaurantId: scope.restaurantId,
    ...(scope.branchId ? { branchId: scope.branchId } : {}),
  };
}
