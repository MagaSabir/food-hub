import { Injectable } from '@nestjs/common';
import { AuthTokenService } from '../auth/application/services/auth-token.service';
import { AccessTokenPayload } from '../auth/domain/types/access-token-payload';
import { InvalidAccessTokenError } from '../auth/domain/errors/auth.errors';

export interface WsHandshake {
  auth?: { token?: unknown };
  headers?: { authorization?: string };
}

@Injectable()
export class WsAuthService {
  constructor(private readonly tokens: AuthTokenService) {}

  async authenticate(handshake: WsHandshake): Promise<AccessTokenPayload> {
    const token = extractToken(handshake);
    if (!token) throw new InvalidAccessTokenError();

    try {
      return await this.tokens.verifyAccess(token);
    } catch {
      throw new InvalidAccessTokenError();
    }
  }
}

export function extractToken(handshake: WsHandshake): string | null {
  const fromAuth = handshake.auth?.token;
  if (typeof fromAuth === 'string' && fromAuth.trim() !== '') {
    return fromAuth.trim();
  }

  const header = handshake.headers?.authorization;
  if (!header) return null;

  const [scheme, token] = header.split(' ');

  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}
