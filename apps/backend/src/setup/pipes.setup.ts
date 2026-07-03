import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Extension, InputValidationError } from '../common/errors/domain.error';
import { ValidationError as ClassValidatorError } from 'class-validator';

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

export function setupPipes(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors: ClassValidatorError[]) => {
        new InputValidationError(errorFormatter(errors));
      },
    }),
  );
}
