import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthTokenService } from '../../application/services/auth-token.service';
import { REFRESH_TOKEN_COOKIE } from '../../constants/auth.constants';
import { InvalidRefreshTokenError } from '../../domain/errors/auth.errors';
import {
  RefreshSession,
  RefreshTokenSource,
} from '../../domain/types/refresh-session';

export interface RequestWithRefreshSession extends Request {
  refreshSession?: RefreshSession;
}

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly tokens: AuthTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithRefreshSession>();

    const extracted = this.extractToken(request);
    if (!extracted) {
      throw new InvalidRefreshTokenError();
    }

    try {
      const payload = await this.tokens.verifyRefresh(extracted.token);

      request.refreshSession = {
        subjectId: payload.sub,
        subjectType: payload.subjectType,
        sessionId: payload.sessionId,
        token: extracted.token,
        source: extracted.source,
      };
    } catch {
      throw new InvalidRefreshTokenError();
    }

    return true;
  }

  private extractToken(
    request: RequestWithRefreshSession,
  ): { token: string; source: RefreshTokenSource } | null {
    const fromCookie = (
      request.cookies as Record<string, string> | undefined
    )?.[REFRESH_TOKEN_COOKIE];
    if (fromCookie) return { token: fromCookie, source: 'cookie' };

    const fromBody = (request.body as { refreshToken?: unknown } | undefined)
      ?.refreshToken;

    return typeof fromBody === 'string' && fromBody.length > 0
      ? { token: fromBody, source: 'body' }
      : null;
  }
}
