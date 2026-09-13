import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { AuthSubjectType } from '../../domain/types/auth-subject';
import { AuthTokenService } from './auth-token.service';

const ACCESS_SECRET = 'a'.repeat(32);
const REFRESH_SECRET = 'r'.repeat(32);

describe('AuthTokenService', () => {
  const accessJwt = new JwtService({
    secret: ACCESS_SECRET,
    signOptions: { expiresIn: '15m' },
  });
  const refreshJwt = new JwtService({
    secret: REFRESH_SECRET,
    signOptions: { expiresIn: '30d' },
  });
  const service = new AuthTokenService(accessJwt, refreshJwt);

  const refreshPayload = {
    sub: 'staff-1',
    subjectType: AuthSubjectType.STAFF,
    sessionId: 'session-1',
  };

  it('access-токен несёт роль и принадлежность', async () => {
    const token = await service.signAccess({
      sub: 'staff-1',
      role: Role.RESTAURANT_OWNER,
      restaurantId: 'restaurant-1',
      branchId: null,
    });

    const decoded = accessJwt.decode<Record<string, unknown>>(token);
    expect(decoded.sub).toBe('staff-1');
    expect(decoded.role).toBe(Role.RESTAURANT_OWNER);
    expect(decoded.restaurantId).toBe('restaurant-1');
  });

  it('refresh-токен НЕ несёт прав — только кто и какая сессия', async () => {
    const { token } = await service.signRefresh(refreshPayload);

    const decoded = refreshJwt.decode<Record<string, unknown>>(token);
    expect(decoded.sessionId).toBe('session-1');
    expect(decoded.role).toBeUndefined();
  });

  it('ttl считается из самого токена (exp − iat)', async () => {
    const { ttlSec } = await service.signRefresh(refreshPayload);

    expect(ttlSec).toBe(30 * 24 * 60 * 60);
  });

  it('два токена одной сессии РАЗНЫЕ, даже выпущенные в одну секунду', async () => {
    const first = await service.signRefresh(refreshPayload);
    const second = await service.signRefresh(refreshPayload);

    expect(second.token).not.toBe(first.token);

    const a = await service.verifyRefresh(first.token);
    const b = await service.verifyRefresh(second.token);
    expect(a.jti).toBeDefined();
    expect(b.jti).not.toBe(a.jti);
  });

  describe('разделение секретов — главное свойство', () => {
    it('access-токен НЕ проходит проверку как refresh', async () => {
      const access = await service.signAccess({
        sub: 'staff-1',
        role: Role.RESTAURANT_OWNER,
      });

      await expect(service.verifyRefresh(access)).rejects.toThrow();
    });

    it('свой refresh проверку проходит', async () => {
      const { token } = await service.signRefresh(refreshPayload);

      const payload = await service.verifyRefresh(token);
      expect(payload.sub).toBe('staff-1');
      expect(payload.sessionId).toBe('session-1');
    });

    it('подделанный токен отвергается', async () => {
      const foreign = new JwtService({ secret: 'f'.repeat(32) });
      const token = foreign.sign(refreshPayload);

      await expect(service.verifyRefresh(token)).rejects.toThrow();
    });
  });
});
