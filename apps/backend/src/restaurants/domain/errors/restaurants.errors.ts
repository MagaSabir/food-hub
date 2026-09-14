import { ErrorCodes } from '@foodhubme/shared';
import { NotFoundError } from '../../../common/errors/domain.error';

export class RestaurantNotFoundError extends NotFoundError {
  readonly code = ErrorCodes.RESTAURANT_NOT_FOUND;

  constructor(slug: string) {
    super(`Ресторан «${slug}» не найден`);
  }
}
