import type { AddFavoriteRequest } from '@foodhubme/shared';
import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { UUID_PATTERN } from '../../common/validation/uuid';

export class AddFavoriteInputDto implements AddFavoriteRequest {
  @ApiProperty({
    format: 'uuid',
    example: '22222222-2222-2222-2222-222222222222',
  })
  @Matches(UUID_PATTERN, { message: 'restaurantId: некорректный id бренда' })
  restaurantId!: string;
}
