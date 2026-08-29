import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ValidationError as ClassValidationError } from 'class-validator';
import { Extension, InputValidationError } from '../common/errors/domain.error';

export function errorFormatter(errors: ClassValidationError[]): Extension[] {
  const result: Extension[] = [];

  for (const error of errors) {
    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        result.push(new Extension(message, error.property));
      }
    }
    if (error.children?.length) {
      result.push(...errorFormatter(error.children));
    }
  }
  return result;
}

export const VALIDATION_PIPE_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  stopAtFirstError: true,
  exceptionFactory: (errors: ClassValidationError[]) =>
    new InputValidationError(errorFormatter(errors)),
};

export function pipesSetup(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));
}
