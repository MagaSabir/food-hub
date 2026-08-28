import { INestApplication, ValidationPipe } from '@nestjs/common';

export const VALIDATION_PIPE_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  stopAtFirstError: true,
};

export function pipesSetup(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));
}
