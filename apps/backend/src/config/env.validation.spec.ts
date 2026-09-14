import * as Joi from 'joi';
import { envValidationSchema, envValidationOptions } from './env.validation';

interface ValidatedEnv {
  error?: Joi.ValidationError;
  value: Record<string, unknown>;
}

const BASE = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/foodhub',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
  JWT_REFRESH_SECRET: 'y'.repeat(32),
};

function validate(env: Record<string, unknown>): ValidatedEnv {
  return envValidationSchema.validate(
    { ...BASE, ...env },
    envValidationOptions,
  );
}

describe('envValidationSchema (Joi)', () => {
  it('требует DATABASE_URL', () => {
    const { error } = envValidationSchema.validate({}, envValidationOptions);
    expect(error?.message).toMatch(/DATABASE_URL/);
  });

  it('требует REDIS_URL (Redis обязателен с Этапа 2)', () => {
    const { error } = envValidationSchema.validate(
      { DATABASE_URL: BASE.DATABASE_URL },
      envValidationOptions,
    );
    expect(error?.message).toMatch(/REDIS_URL/);
  });

  it('требует JWT_ACCESS_SECRET и отвергает короткий', () => {
    const { DATABASE_URL, REDIS_URL } = BASE;
    const missing = envValidationSchema.validate(
      { DATABASE_URL, REDIS_URL },
      envValidationOptions,
    );
    expect(missing.error?.message).toMatch(/JWT_ACCESS_SECRET/);

    const short = validate({ JWT_ACCESS_SECRET: 'слишком-коротко' });
    expect(short.error?.message).toMatch(/JWT_ACCESS_SECRET/);
  });

  it('JWT_ACCESS_EXPIRES_IN по умолчанию 15m', () => {
    const { error, value } = validate({});
    expect(error).toBeUndefined();
    expect(value.JWT_ACCESS_EXPIRES_IN).toBe('15m');
  });

  it('принимает REDIS_URL со схемой rediss (TLS) и redis', () => {
    expect(
      validate({ REDIS_URL: 'rediss://default:t@x.upstash.io:6379' }).error,
    ).toBeUndefined();
    expect(
      validate({ REDIS_URL: 'redis://localhost:6379' }).error,
    ).toBeUndefined();
  });

  it('падает на REDIS_URL с чужой схемой', () => {
    const { error } = validate({ REDIS_URL: 'http://localhost:6379' });
    expect(error?.message).toMatch(/REDIS_URL/);
  });

  it('применяет значения по умолчанию, когда env пустой', () => {
    const { error, value } = validate({});
    expect(error).toBeUndefined();
    expect(value.NODE_ENV).toBe('development');
    expect(value.PORT).toBe(3000);
    expect(value.APP_NAME).toBe('foodhub');
    expect(value.GLOBAL_PREFIX).toBe('api');
    expect(value.THROTTLE_TTL).toBe(60);
    expect(value.THROTTLE_LIMIT).toBe(100);
  });

  it('приводит PORT из строки в число', () => {
    const { error, value } = validate({ PORT: '4000' });
    expect(error).toBeUndefined();
    expect(value.PORT).toBe(4000);
  });

  it('падает при некорректном PORT (вне диапазона)', () => {
    const { error } = validate({ PORT: '70000' });
    expect(error?.message).toMatch(/PORT/);
  });

  it('падает при неизвестном NODE_ENV', () => {
    const { error } = validate({ NODE_ENV: 'staging' });
    expect(error?.message).toMatch(/NODE_ENV/);
  });

  it('требует COOKIE_SECRET в production', () => {
    const { error } = validate({ NODE_ENV: 'production' });
    expect(error?.message).toMatch(/COOKIE_SECRET/);
  });

  it('не требует COOKIE_SECRET вне production', () => {
    const { error } = validate({ NODE_ENV: 'development' });
    expect(error).toBeUndefined();
  });

  it('пропускает неизвестные переменные (allowUnknown)', () => {
    const { error } = validate({ SOME_FUTURE_VAR: 'x' });
    expect(error).toBeUndefined();
  });
});
