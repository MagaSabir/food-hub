import { ErrorCodes } from '@foodhubme/shared';

export class Extension {
  constructor(
    public readonly message: string,
    public readonly field: string,
  ) {}
}

export abstract class DomainError extends Error {
  abstract readonly code: string;
  readonly extensions: Extension[];

  constructor(message: string, extensions: Extension[] = []) {
    super(message);
    this.name = new.target.name;
    this.extensions = extensions;
  }
}

export abstract class NotFoundError extends DomainError {}
export abstract class ValidationError extends DomainError {}
export abstract class ForbiddenError extends DomainError {}
export abstract class UnauthorizedError extends DomainError {}

export class InputValidationError extends ValidationError {
  readonly code = ErrorCodes.VALIDATION_ERROR;

  constructor(extensions: Extension[] = []) {
    super('Ошибка валидации', extensions);
  }
}
