import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { AuthSubjectType } from '../../domain/types/auth-subject';
import { LoginPolicy } from '../../domain/policies/login.policy';

@Injectable()
export class LoginAttemptsRepository {
  constructor(private readonly redis: RedisService) {}

  private key(type: AuthSubjectType, email: string): string {
    return `login:fails:${type}:${email.toLowerCase()}`;
  }

  async lockedForSec(type: AuthSubjectType, email: string): Promise<number> {
    const key = this.key(type, email);
    const [fails, ttl] = await Promise.all([
      this.redis.client.get(key),
      this.redis.client.ttl(key),
    ]);

    if (Number(fails) < LoginPolicy.MAX_ATTEMPTS) return 0;

    return ttl > 0 ? ttl : 0;
  }

  async registerFailure(type: AuthSubjectType, email: string): Promise<void> {
    const key = this.key(type, email);
    const fails = await this.redis.client.incr(key);

    if (fails === 1) {
      await this.redis.client.expire(key, LoginPolicy.WINDOW_SEC);
    }
  }

  async reset(type: AuthSubjectType, email: string): Promise<void> {
    await this.redis.client.del(this.key(type, email));
  }
}
