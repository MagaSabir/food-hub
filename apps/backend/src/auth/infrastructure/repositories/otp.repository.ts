import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { OtpPolicy } from '../../domain/policies/otp.policy';

@Injectable()
export class OtpRepository {
  constructor(private readonly redis: RedisService) {}

  private codeKey(phone: string): string {
    return `otp:code:${phone}`;
  }

  private cooldownKey(phone: string): string {
    return `otp:cooldown:${phone}`;
  }

  private countKey(phone: string): string {
    return `otp:count:${phone}`;
  }

  async startCooldown(phone: string): Promise<number> {
    const key = this.cooldownKey(phone);
    const claimed = await this.redis.client.set(
      key,
      '1',
      'EX',
      OtpPolicy.COOLDOWN_SEC,
      'NX',
    );

    if (claimed === 'OK') return 0;

    const ttl = await this.redis.client.ttl(key);

    return ttl > 0 ? ttl : 1;
  }

  async releaseCooldown(phone: string): Promise<void> {
    await this.redis.client.del(this.cooldownKey(phone));
  }

  async cooldownLeftSec(phone: string): Promise<number> {
    const ttl = await this.redis.client.ttl(this.cooldownKey(phone));

    return ttl > 0 ? ttl : 0;
  }

  async incrementHourlyCount(phone: string): Promise<number> {
    const key = this.countKey(phone);
    const count = await this.redis.client.incr(key);

    if (count === 1) {
      await this.redis.client.expire(key, OtpPolicy.HOUR_SEC);
    }

    return count;
  }

  private attemptsKey(phone: string): string {
    return `otp:attempts:${phone}`;
  }

  async saveCode(phone: string, codeHash: string): Promise<void> {
    await this.redis.client
      .multi()
      .set(this.codeKey(phone), codeHash, 'EX', OtpPolicy.TTL_SEC)
      .del(this.attemptsKey(phone))
      .exec();
  }

  findCodeHash(phone: string): Promise<string | null> {
    return this.redis.client.get(this.codeKey(phone));
  }

  async incrementAttempts(phone: string): Promise<number> {
    const key = this.attemptsKey(phone);
    const attempts = await this.redis.client.incr(key);

    if (attempts === 1) {
      await this.redis.client.expire(key, OtpPolicy.TTL_SEC);
    }

    return attempts;
  }

  async deleteCode(phone: string): Promise<void> {
    await this.redis.client.del(this.codeKey(phone), this.attemptsKey(phone));
  }
}
