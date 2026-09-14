import type { SaveAddressRequest } from '@foodhubme/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class SaveAddressInputDto implements SaveAddressRequest {
  @ApiProperty({ example: 'пр. Путина, 12', maxLength: 200 })
  @IsString({ message: 'address: строка' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(5, 200, { message: 'address: от 5 до 200 символов' })
  address!: string;

  @ApiPropertyOptional({
    example: 'Грозный',
    maxLength: 100,
    description:
      'Населённый пункт из подсказки карты. Не прислали — шапка каталога ' +
      'покажет город пилота.',
  })
  @IsOptional()
  @IsString({ message: 'locality: строка' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(100, { message: 'locality: не длиннее 100 символов' })
  locality?: string | null;

  @ApiPropertyOptional({
    example: 'подъезд 2, этаж 5, код 45',
    maxLength: 200,
    description: 'Свободный текст для курьера — ничем не проверяется.',
  })
  @IsOptional()
  @IsString({ message: 'details: строка' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(200, { message: 'details: не длиннее 200 символов' })
  details?: string | null;

  @ApiProperty({ example: 43.3169 })
  @IsLatitude({ message: 'latitude: некорректная широта' })
  latitude!: number;

  @ApiProperty({ example: 45.6981 })
  @IsLongitude({ message: 'longitude: некорректная долгота' })
  longitude!: number;
}
