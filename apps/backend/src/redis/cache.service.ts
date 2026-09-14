import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly redis: RedisService) {}

  async wrap<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.read<T>(key);
    if (cached !== null) return cached;

    const value = await loader();
    if (value !== null && value !== undefined)
      await this.write(key, ttlSeconds, value);
    return value;
  }

  async invalidate(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await this.redis.client.del(...keys);
    } catch (e) {
      this.logger.warn(
        `Кеш: не удалось сбросить ${keys.join(', ')} — ${(e as Error).message}`,
      );
    }
  }

  private async read<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.client.get(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (e) {
      this.logger.warn(
        `Кеш: чтение ${key} не удалось — ${(e as Error).message}`,
      );
      return null;
    }
  }

  private async write<T>(
    key: string,
    ttlSeconds: number,
    value: T,
  ): Promise<void> {
    try {
      await this.redis.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (e) {
      this.logger.warn(
        `Кеш: запись ${key} не удалась — ${(e as Error).message}`,
      );
    }
  }
}
