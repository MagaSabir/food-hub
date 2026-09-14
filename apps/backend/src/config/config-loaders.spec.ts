import { appConfig } from './app.config';
import { environmentConfig } from './environment.config';
import { corsConfig } from './cors.config';
import { swaggerConfig } from './swagger.config';
import { throttleConfig } from './throttle.config';
import { databaseConfig } from './database.config';
import { redisConfig } from './redis.config';

describe('config loaders', () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original };
  });

  afterAll(() => {
    process.env = original;
  });

  it('appConfig: дефолты', () => {
    delete process.env.APP_NAME;
    delete process.env.PORT;
    delete process.env.GLOBAL_PREFIX;
    const cfg = appConfig();
    expect(cfg.name).toBe('foodhub');
    expect(cfg.port).toBe(3000);
    expect(cfg.globalPrefix).toBe('api');
    expect(cfg.sendInternalServerErrorDetails).toBe(false);
  });

  it('environmentConfig: флаги по NODE_ENV', () => {
    process.env.NODE_ENV = 'production';
    const cfg = environmentConfig();
    expect(cfg.nodeEnv).toBe('production');
    expect(cfg.isProduction).toBe(true);
    expect(cfg.isDevelopment).toBe(false);
    expect(cfg.isTest).toBe(false);
  });

  it('corsConfig: пусто/«*» → true, список → массив', () => {
    delete process.env.CORS_ORIGIN;
    expect(corsConfig().origin).toBe(true);

    process.env.CORS_ORIGIN = 'https://a.com, https://b.com';
    expect(corsConfig().origin).toEqual(['https://a.com', 'https://b.com']);
  });

  it('swaggerConfig: выключен в production по умолчанию', () => {
    delete process.env.SWAGGER_ENABLED;
    process.env.NODE_ENV = 'production';
    expect(swaggerConfig().enabled).toBe(false);

    process.env.NODE_ENV = 'development';
    expect(swaggerConfig().enabled).toBe(true);

    process.env.SWAGGER_ENABLED = 'true';
    process.env.NODE_ENV = 'production';
    expect(swaggerConfig().enabled).toBe(true);
  });

  it('throttleConfig: дефолты', () => {
    delete process.env.THROTTLE_TTL;
    delete process.env.THROTTLE_LIMIT;
    const cfg = throttleConfig();
    expect(cfg.ttl).toBe(60);
    expect(cfg.limit).toBe(100);
  });

  it('databaseConfig: берёт DATABASE_URL из env', () => {
    process.env.DATABASE_URL = 'postgresql://u:p@host:5432/db';
    expect(databaseConfig().url).toBe('postgresql://u:p@host:5432/db');
  });

  it('redisConfig: берёт REDIS_URL из env', () => {
    process.env.REDIS_URL = 'rediss://default:token@host.upstash.io:6379';
    expect(redisConfig().url).toBe(
      'rediss://default:token@host.upstash.io:6379',
    );
  });
});
