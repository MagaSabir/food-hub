import { OrderStatus } from '@foodhubme/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class RestaurantOrdersQueryInputDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    description:
      'Показать только заказы в этом статусе. Без параметра — все ' +
      '(последние 50), а не «активные»: что считать активным, решает экран.',
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'status: неизвестный статус заказа' })
  status?: OrderStatus;
}
