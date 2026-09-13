import { Injectable } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';
import { SessionsRepository } from '../../infrastructure/repositories/sessions.repository';
import { AuthSubjectType, AuthTokens } from '../../domain/types/auth-subject';
import { AccessTokenPayload } from '../../domain/types/access-token-payload';
import { randomUUID } from 'node:crypto';

@Injectable()
export class SessionIssuer {
  constructor(
    private readonly tokens: AuthTokenService,
    private readonly sessions: SessionsRepository,
  ) {}
  /**
   * @param sessionId - при входе новый, при обновлении тот же самый:
   * ротация меняет токен, но не "переезжает" на другое устройство;
   */

  async issue(
    subjectType: AuthSubjectType,
    accessPayload: AccessTokenPayload,
    sessionId: string = randomUUID(),
  ): Promise<AuthTokens> {
    const accessToken = await this.tokens.signAccess(accessPayload);

    const { token: refreshToken, ttlSec } = await this.tokens.signRefresh({
      sub: accessPayload.sub,
      subjectType,
      sessionId,
    });

    await this.sessions.save(
      subjectType,
      accessPayload.sub,
      sessionId,
      refreshToken,
      ttlSec,
    );

    return { accessToken, refreshToken, refreshTtlSec: ttlSec };
  }
}
