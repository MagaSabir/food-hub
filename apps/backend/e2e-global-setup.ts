import { config as loadEnv } from 'dotenv';
import Redis from 'ioredis';

const THROTTLER_KEYS = '*:default}:*';
const CACHE_KEYS = 'cache:v2:*';

export default async function globalSetup(): Promise<void> {
  const NODE_ENV = process.env.NODE_ENV ?? 'test';
  loadEnv({ path: `env/.env.${NODE_ENV}` });
  loadEnv({ path: 'env/.env' });

  const url = process.env.REDIS_URL;
  if (!url) return;

  const redis = new Redis(url, { maxRetriesPerRequest: 3 });
  try {
    for (const pattern of [THROTTLER_KEYS, CACHE_KEYS]) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
    }
  } finally {
    await redis.quit();
  }
}
