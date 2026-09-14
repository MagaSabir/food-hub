import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { AuthSubjectType } from '../../domain/types/auth-subject';

export enum SessionState {
  CURRENT = 'CURRENT',
  STALE = 'STALE',
  MISSING = 'MISSING',
}

@Injectable()
export class SessionsRepository {
  constructor(private readonly redis: RedisService) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sessionKey(
    type: AuthSubjectType,
    subjectId: string,
    sessionId: string,
  ): string {
    return `session:${type}:${subjectId}:${sessionId}`;
  }

  private indexKey(type: AuthSubjectType, subjectId: string): string {
    return `sessions:${type}:${subjectId}`;
  }

  async save(
    type: AuthSubjectType,
    subjectId: string,
    sessionId: string,
    refreshToken: string,
    ttlSec: number,
  ): Promise<void> {
    const index = this.indexKey(type, subjectId);

    await this.redis.client
      .multi()
      .set(
        this.sessionKey(type, subjectId, sessionId),
        this.hash(refreshToken),
        'EX',
        ttlSec,
      )
      .sadd(index, sessionId)
      .expire(index, ttlSec)
      .exec();
  }

  async check(
    type: AuthSubjectType,
    subjectId: string,
    sessionId: string,
    refreshToken: string,
  ): Promise<SessionState> {
    const stored = await this.redis.client.get(
      this.sessionKey(type, subjectId, sessionId),
    );

    if (stored === null) return SessionState.MISSING;

    return stored === this.hash(refreshToken)
      ? SessionState.CURRENT
      : SessionState.STALE;
  }

  async delete(
    type: AuthSubjectType,
    subjectId: string,
    sessionId: string,
  ): Promise<void> {
    await this.redis.client
      .multi()
      .del(this.sessionKey(type, subjectId, sessionId))
      .srem(this.indexKey(type, subjectId), sessionId)
      .exec();
  }

  async deleteAllForSubject(
    type: AuthSubjectType,
    subjectId: string,
  ): Promise<void> {
    const index = this.indexKey(type, subjectId);
    const sessionIds = await this.redis.client.smembers(index);

    const keys = sessionIds.map((id) => this.sessionKey(type, subjectId, id));
    await this.redis.client.del(...keys, index);
  }
}
