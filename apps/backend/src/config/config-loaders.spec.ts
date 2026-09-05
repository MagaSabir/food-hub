import { appConfig } from './app.config';
import { environmentConfig } from './environment.config';
import { swaggerConfig } from './swagger.config';
import { databaseConfig } from './database.config';
import { authConfig } from './auth.config';

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
    expect(cfg.port).toBe(3000);
    expect(cfg.name).toBe('foodhubme');
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

  it('swaggerConfig', () => {
    delete process.env.SWAGGER_ENABLED;
    process.env.NODE_ENV = 'production';
    expect(swaggerConfig().enabled).toBe(false);

    process.env.NODE_ENV = 'development';
    expect(swaggerConfig().enabled).toBe(true);

    process.env.SWAGGER_ENABLED = 'true';
    process.env.NODE_ENV = 'production';
    expect(swaggerConfig().enabled).toBe(true);
  });

  it('databaseConfig: берёт DATABASE_URL из env', () => {
    process.env.DATABASE_URL = 'postgresql://u:p@host:5432/db';
    expect(databaseConfig().url).toBe('postgresql://u:p@host:5432/db');
  });

  it('authConfig: берет секреты и строки из env', () => {
    process.env.JWT_ACCESS_SECRET = 'secret';
    process.env.JWT_ACCESS_EXPIRES_IN = '7m';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    process.env.JWT_REFRESH_EXPIRES_IN = '14d';
    const cfg = authConfig();
    expect(cfg.accessSecret).toBe('secret');
    expect(cfg.refreshSecret).toBe('refresh-secret');
    expect(cfg.accessExpiresIn).toBe('7m');
    expect(cfg.refreshExpiresIn).toBe('14d');
  });
});
