import { Role } from '@prisma/client';
import { AccessTokenPayload } from '../types/access-token-payload';
import { InvalidAccessTokenError } from '../errors/auth.errors';
import { staffScope } from './staff-scope';

describe('staffScope', () => {
  const token = (over: Partial<AccessTokenPayload>): AccessTokenPayload => ({
    sub: 'staff-1',
    role: Role.RESTAURANT_STAFF,
    ...over,
  });

  it('сотрудник точки ограничен своей точкой', () => {
    expect(
      staffScope(token({ restaurantId: 'brand-1', branchId: 'branch-7' })),
    ).toEqual({ restaurantId: 'brand-1', branchId: 'branch-7' });
  });

  it('владелец без точки видит весь бренд', () => {
    expect(
      staffScope(
        token({
          role: Role.RESTAURANT_OWNER,
          restaurantId: 'brand-1',
          branchId: null,
        }),
      ),
    ).toEqual({ restaurantId: 'brand-1', branchId: null });
  });

  it('поля branchId нет вовсе → тоже весь бренд, а не «ничего»', () => {
    expect(staffScope(token({ restaurantId: 'brand-1' })).branchId).toBeNull();
  });

  it('токен без ресторана — испорченный, а не «человек без прав»', () => {
    expect(() => staffScope(token({}))).toThrow(InvalidAccessTokenError);
  });
});
