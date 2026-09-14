import type { AddFavoriteRequest } from '@foodhubme/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddFavoriteInputDto implements AddFavoriteRequest {
  @ApiProperty({
    format: 'uuid',
    example: '22222222-2222-2222-2222-222222222222',
  })
  @IsUUID('4', { message: 'restaurantId: некорректный uuid' })
  restaurantId!: string;
}
