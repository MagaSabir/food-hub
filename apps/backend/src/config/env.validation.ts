import Joi from 'joi';
const bool = () => Joi.boolean().truthy('true').falsy('false');
export const envValidationSchema = Joi.object({
  // - APP -
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_NAME: Joi.string().default('foodhubme'),
  PORT: Joi.number().port().default(3000),
  GLOBAL_PREFIX: Joi.string().default('api'),

  // - SWAGGER -
  SWAGGER_ENABLED: bool(),
  SWAGGER_PATH: Joi.string().default('api/docs'),
});
