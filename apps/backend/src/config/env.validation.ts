import * as Joi from 'joi';

const bool = () => Joi.boolean().truthy('true').falsy('false');

export const envValidationSchema = Joi.object().keys({
  // - App -
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  APP_NAME: Joi.string().default('foodhubme'),
  PORT: Joi.number().default(3000),
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
});
