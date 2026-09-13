import { ErrorCodes } from '@foodhubme/shared';
import {
  ForbiddenError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../../../common/errors/domain.error';

export class InvalidCredentialsError extends UnauthorizedError {
  readonly code = ErrorCodes.INVALID_CREDENTIALS;

  constructor() {
    super('Неверный email или пароль');
  }
}

export class InvalidRefreshTokenError extends UnauthorizedError {
  readonly code = ErrorCodes.INVALID_REFRESH_TOKEN;

  constructor() {
    super('Сессия недействительна, войдите заново');
  }
}

export class InvalidAccessTokenError extends UnauthorizedError {
  readonly code = ErrorCodes.INVALID_ACCESS_TOKEN;

  constructor() {
    super('Требуется авторизация');
  }
}

export class AccessDeniedError extends ForbiddenError {
  readonly code = ErrorCodes.ACCESS_DENIED;

  constructor() {
    super('Недостаточно прав');
  }
}

export class LoginAttemptsExceededError extends TooManyRequestsError {
  readonly code = ErrorCodes.LOGIN_ATTEMPTS_EXCEEDED;

  constructor(public readonly retryAfterSec: number) {
    super(`Слишком много попыток входа. Повторите через ${retryAfterSec} сек`);
  }
}

export class OtpTooSoonError extends TooManyRequestsError {
  readonly code = ErrorCodes.OTP_TOO_SOON;

  constructor(public readonly retryAfterSec: number) {
    super(`Повторить запрос можно через ${retryAfterSec} сек`);
  }
}

export class OtpLimitExceededError extends TooManyRequestsError {
  readonly code = ErrorCodes.OTP_LIMIT_EXCEEDED;

  constructor() {
    super('Слишком много запросов кода. Попробуйте позже');
  }
}

export class InvalidOtpError extends UnauthorizedError {
  readonly code = ErrorCodes.INVALID_OTP;

  constructor() {
    super('Неверный код');
  }
}

export class OtpAttemptsExceededError extends UnauthorizedError {
  readonly code = ErrorCodes.OTP_ATTEMPTS_EXCEEDED;

  constructor() {
    super('Слишком много попыток. Запросите новый код');
  }
}
