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

/**
 * Семантические КАТЕГОРИИ ошибок. Это смысл («не найдено», «конфликт»),
 * а НЕ http-статус. Конкретные ошибки модулей наследуются от категории, напр.:
 *
 *   export class RestaurantNotFoundError extends NotFoundError {
 *     readonly code = 'RESTAURANT_NOT_FOUND';
 *     constructor(id: string) { super(`Ресторан ${id} не найден`); }
 *   }
 */

export abstract class NotFoundError extends DomainError {}
export abstract class ValidationError extends DomainError {}
export abstract class ForbiddenError extends DomainError {}
export abstract class UnauthorizedError extends DomainError {}
export abstract class ConflictError extends DomainError {}
export abstract class TooManyRequestsError extends DomainError {}

/**
 * Конкретная ошибка валидации входных DTO. Её кидает глобальный ValidationPipe
 * (см. setup/pipes.setup.ts) — встроенная валидация Nest идёт через тот же
 * единый формат, что и доменные ошибки.
 */
export class InputValidationError extends ValidationError {
  readonly code = ErrorCodes.VALIDATION_ERROR;
  constructor(extension: Extension[]) {
    super('Ошибка валидации', extension);
  }
}
