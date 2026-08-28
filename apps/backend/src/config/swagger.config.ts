import { registerAs } from '@nestjs/config';
import { SwaggerConfig } from './types';

export const swaggerConfig = registerAs('swagger', (): SwaggerConfig => {
  const raw = process.env.SWAGGER_ENABLED;
  const enabled =
    raw !== undefined ? raw === 'true' : process.env.NODE_ENV !== 'production';
  return {
    enabled,
    path: process.env.SWAGGER_PATH ?? 'api/docs',
  };
});
