import { ErrorCodes } from '@foodhubme/shared';
import { NotFoundError } from '../../common/errors/domain.error';

export class MenuItemNotFoundError extends NotFoundError {
  readonly code = ErrorCodes.MENU_ITEM_NOT_FOUND;

  constructor(id: string) {
    super(`Позиция меню ${id} не найдена`);
  }
}
