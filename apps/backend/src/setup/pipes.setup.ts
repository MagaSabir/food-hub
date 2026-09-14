import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { Extension, InputValidationError } from '../common/errors/domain.error';

export function errorFormatter(errors: ClassValidatorError[]): Extension[] {
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
  transform: true,
  stopAtFirstError: true,
  forbidNonWhitelisted: false,
  transformOptions: { enableImplicitConversion: true },
  exceptionFactory: (errors: ClassValidatorError[]) =>
    new InputValidationError(errorFormatter(errors)),
} as const;

export function setupPipes(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));
}
