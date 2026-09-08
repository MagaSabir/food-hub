import * as Joi from 'joi';

const bool = () => Joi.boolean().truthy('true').falsy('false');

export const envValidationSchema = Joi.object().keys({
  // - App -
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  APP_NAME: Joi.string().default('foodhubme'),
  PORT: Joi.number().port().default(3000),
  GLOBAL_PREFIX: Joi.string().default('api'),
  SEND_INTERNAL_SERVER_ERROR_DETAILS: bool().default(false),

  // - Swagger -
  SWAGGER_ENABLED: bool(),
  SWAGGER_PATH: Joi.string().default('api/docs'),

  // - Database -
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  LOG_QUERIES: bool().default(false),

  // - Redis -
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'redis'] })
    .required(),

  // - JWT -
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
});
