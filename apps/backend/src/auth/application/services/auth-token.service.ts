import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ACCESS_JWT_SERVICE,
  REFRESH_JWT_SERVICE,
} from '../../constants/auth.constants';
import { AccessTokenPayload } from '../../domain/types/access-token-payload';
import {
  RefreshTokenPayload,
  SignedRefreshTokenPayload,
} from '../../domain/types/refresh-token-payload';

@Injectable()
export class AuthTokenService {
  constructor(
    @Inject(ACCESS_JWT_SERVICE) private readonly accessJwt: JwtService,
    @Inject(REFRESH_JWT_SERVICE) private readonly refreshJwt: JwtService,
  ) {}

  signAccess(payload: AccessTokenPayload): Promise<string> {
    return this.accessJwt.signAsync(payload);
  }

  async signRefresh(
    payload: RefreshTokenPayload,
  ): Promise<{ token: string; ttlSec: number }> {
    const token = await this.refreshJwt.signAsync(payload, {
      jwtid: randomUUID(),
    });
    const { iat, exp } =
      this.refreshJwt.decode<SignedRefreshTokenPayload>(token);

    return { token, ttlSec: exp - iat };
  }

  verifyRefresh(token: string): Promise<SignedRefreshTokenPayload> {
    return this.refreshJwt.verifyAsync<SignedRefreshTokenPayload>(token);
  }

  verifyAccess(token: string): Promise<AccessTokenPayload> {
    return this.accessJwt.verifyAsync<AccessTokenPayload>(token);
  }
}
