import * as Joi from 'joi';

const bool = () => Joi.boolean().truthy('true').falsy('false');

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  LOG_QUERIES: bool().default(false),

  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('15m'),

  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .invalid(Joi.ref('JWT_ACCESS_SECRET')),
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('30d'),

  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  APP_NAME: Joi.string().default('foodhub'),
  PORT: Joi.number().port().default(3000),
  GLOBAL_PREFIX: Joi.string().default('api'),
  SEND_INTERNAL_SERVER_ERROR_DETAILS: bool().default(false),

  CORS_ORIGIN: Joi.string().allow('').default('*'),
  CORS_CREDENTIALS: bool().default(true),

  COOKIE_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(1).required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  COOKIE_HTTP_ONLY: bool().default(true),
  COOKIE_SECURE: bool().default(false),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),
  COOKIE_MAX_AGE: Joi.number().default(2592000000),

  SWAGGER_ENABLED: bool(),
  SWAGGER_PATH: Joi.string().default('api/docs'),

  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
});

export const envValidationOptions = {
  abortEarly: false,
  allowUnknown: true,
};
