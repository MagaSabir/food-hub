import { OrderStatus } from '@foodhubme/shared';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { OrderPolicy } from '../../domain/policies/order.policy';

export class AcceptOrderInputDto {
  @ApiProperty({
    example: 30,
    minimum: OrderPolicy.PREP_MINUTES.MIN,
    maximum: OrderPolicy.PREP_MINUTES.MAX,
    description:
      'Сколько минут готовить. Это число человек увидит в приложении как ' +
      'обещание — поэтому оно обязательно.',
  })
  @IsInt({ message: 'prepMinutes: целое число минут' })
  @Min(OrderPolicy.PREP_MINUTES.MIN)
  @Max(OrderPolicy.PREP_MINUTES.MAX)
  prepMinutes!: number;
}

export class RejectOrderInputDto {
  @ApiProperty({
    example: 'Закончилось тесто, сегодня пиццу не сделаем',
    minLength: OrderPolicy.CANCEL_REASON.MIN_LENGTH,
    maxLength: OrderPolicy.CANCEL_REASON.MAX_LENGTH,
    description:
      'Причина отказа своими словами — её ЧИТАЕТ клиент, а не только ' +
      'служба поддержки.',
  })
  @IsString()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(OrderPolicy.CANCEL_REASON.MIN_LENGTH, {
    message: 'reason: объясните причину, а не ставьте прочерк',
  })
  @MaxLength(OrderPolicy.CANCEL_REASON.MAX_LENGTH)
  reason!: string;
}

export const CHANGEABLE_STATUSES = [
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.ON_THE_WAY,
  OrderStatus.COMPLETED,
] as const;

export type ChangeableStatus = (typeof CHANGEABLE_STATUSES)[number];

export class ChangeOrderStatusInputDto {
  @ApiProperty({
    enum: CHANGEABLE_STATUSES,
    example: OrderStatus.READY,
    description:
      'Новый статус. Допустим только СЛЕДУЮЩИЙ шаг маршрута заказа — ' +
      'перескок через статус вернёт ORDER_STATUS_CONFLICT.',
  })
  @IsIn(CHANGEABLE_STATUSES, {
    message:
      'status: сюда идут PREPARING, READY, ON_THE_WAY, COMPLETED; ' +
      'приём и отказ — отдельными действиями',
  })
  status!: ChangeableStatus;
}
