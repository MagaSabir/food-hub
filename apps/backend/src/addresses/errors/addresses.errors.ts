import { ErrorCodes, MAX_SAVED_ADDRESSES } from '@foodhubme/shared';
import { ConflictError, NotFoundError } from '../../common/errors/domain.error';

export class AddressLimitReachedError extends ConflictError {
  readonly code = ErrorCodes.ADDRESS_LIMIT_REACHED;

  constructor() {
    super(
      `Сохранить можно не больше ${MAX_SAVED_ADDRESSES} адресов — удалите лишний`,
    );
  }
}

export class AddressNotFoundError extends NotFoundError {
  readonly code = ErrorCodes.ADDRESS_NOT_FOUND;

  constructor(id: string) {
    super(`Адрес ${id} не найден`);
  }
}
