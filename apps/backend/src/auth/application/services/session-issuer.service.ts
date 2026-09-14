import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { AccessTokenPayload } from '../../domain/types/access-token-payload';
import { AuthSubjectType, AuthTokens } from '../../domain/types/auth-subject';
import { SessionsRepository } from '../../infrastructure/repositories/sessions.repository';
import { AuthTokenService } from './auth-token.service';

@Injectable()
export class SessionIssuer {
  constructor(
    private readonly tokens: AuthTokenService,
    private readonly sessions: SessionsRepository,
  ) {}

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
