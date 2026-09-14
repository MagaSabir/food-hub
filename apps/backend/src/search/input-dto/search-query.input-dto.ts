import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { SearchPolicy } from '../search.policy';

export class SearchQueryInputDto {
  @ApiProperty({
    example: 'шаурма',
    minLength: SearchPolicy.MIN_QUERY_LENGTH,
    maxLength: SearchPolicy.MAX_QUERY_LENGTH,
    description:
      'Что ищем. Ищется и по названиям заведений (вхождение), и по кухне ' +
      '(точное совпадение), и по названиям блюд.',
  })
  @IsString({ message: 'q: строка' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(SearchPolicy.MIN_QUERY_LENGTH, SearchPolicy.MAX_QUERY_LENGTH, {
    message: `q: от ${SearchPolicy.MIN_QUERY_LENGTH} до ${SearchPolicy.MAX_QUERY_LENGTH} символов`,
  })
  q!: string;
}
