import { UnauthorizedError } from '../../../common/errors/domain.error';
import { ErrorCodes } from '@foodhubme/shared';

export class InvalidCredentialsError extends UnauthorizedError {
  readonly code = ErrorCodes.INVALID_CREDENTIALS;

  constructor() {
    super('Неверный email или пароль');
  }
}
