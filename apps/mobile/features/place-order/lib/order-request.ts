import {
  PaymentMethod,
  type CreateOrderRequest,
  type DeliveryQuoteRequest,
} from '@foodhubme/shared';

export function toCreateOrderRequest(
  quoteRequest: DeliveryQuoteRequest,
  comment: string,
): CreateOrderRequest {
  const trimmed = comment.trim();

  return {
    ...quoteRequest,
    paymentMethod: PaymentMethod.CASH,
    ...(trimmed === '' ? {} : { comment: trimmed }),
  };
}
