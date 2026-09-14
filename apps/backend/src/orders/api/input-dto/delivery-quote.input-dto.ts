import { DeliveryQuoteRequest } from '@foodhubme/shared';
import { OmitType } from '@nestjs/swagger';
import { CreateOrderInputDto } from './create-order.input-dto';

export class DeliveryQuoteInputDto
  extends OmitType(CreateOrderInputDto, [
    'paymentMethod',
    'contactPhone',
    'comment',
  ] as const)
  implements DeliveryQuoteRequest {}
