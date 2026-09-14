import type { UpdateProfileRequest } from '@foodhubme/shared';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

const NAME_MIN = 2;
const NAME_MAX = 50;

export class UpdateProfileInputDto implements UpdateProfileRequest {
  @ApiProperty({
    example: 'Магомед',
    minLength: NAME_MIN,
    maxLength: NAME_MAX,
    description:
      'Как обращаться. Видят курьер и ресторан — «заказ для Магомеда» ' +
      'понятнее, чем «заказ №1043».',
  })
  @IsString({ message: 'name: строка' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(NAME_MIN, NAME_MAX, {
    message: `name: от ${NAME_MIN} до ${NAME_MAX} символов`,
  })
  name!: string;
}
