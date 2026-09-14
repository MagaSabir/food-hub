import { ErrorCodes, OrderBlockReason } from '@foodhubme/shared';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../common/errors/domain.error';

export class MenuItemUnavailableError extends ValidationError {
  readonly code = ErrorCodes.MENU_ITEM_UNAVAILABLE;

  constructor(itemName: string) {
    super(`«${itemName}» закончилось — уберите позицию из корзины`);
  }
}

export class InvalidModifiersError extends ValidationError {
  readonly code = ErrorCodes.INVALID_MODIFIERS;

  constructor(message: string) {
    super(message);
  }
}

const BLOCK_REASON_MESSAGE: Record<OrderBlockReason, string> = {
  [OrderBlockReason.NO_BRANCH]:
    'Заказ некому исполнить — у заведения нет подходящей точки',
  [OrderBlockReason.TYPE_UNAVAILABLE]:
    'Заведение не принимает заказы такого типа',
  [OrderBlockReason.TOO_FAR]:
    'По этому адресу мы не возим — можно забрать заказ самому',
  [OrderBlockReason.CLOSED]: 'Заведение сейчас закрыто',
  [OrderBlockReason.NOT_ACCEPTING]: 'Заведение временно не принимает заказы',
  [OrderBlockReason.MIN_ORDER]: 'Не набрана минимальная сумма заказа',
};

export class OrderNotAvailableError extends ValidationError {
  readonly code = ErrorCodes.ORDER_NOT_AVAILABLE;

  constructor(
    public readonly blockReason: OrderBlockReason,
    detail?: string,
  ) {
    const base = BLOCK_REASON_MESSAGE[blockReason];
    super(detail ? `${base}: ${detail}` : base);
  }
}

export class OrderQuantityExceededError extends ValidationError {
  readonly code = ErrorCodes.VALIDATION_ERROR;

  constructor(itemName: string, max: number) {
    super(`«${itemName}»: можно заказать не больше ${max} штук`);
  }
}

export class PaymentMethodUnavailableError extends ValidationError {
  readonly code = ErrorCodes.PAYMENT_METHOD_UNAVAILABLE;

  constructor(method: string) {
    super(`Оплата «${method}» пока недоступна — выберите наличные`);
  }
}

export class OrderNotFoundError extends NotFoundError {
  readonly code = ErrorCodes.ORDER_NOT_FOUND;

  constructor(id: string) {
    super(`Заказ ${id} не найден`);
  }
}

export class OrderStatusConflictError extends ConflictError {
  readonly code = ErrorCodes.ORDER_STATUS_CONFLICT;

  constructor(
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`Заказ уже в статусе «${from}» — перевести его в «${to}» нельзя`);
  }
}
