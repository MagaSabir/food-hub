import { CatalogSort } from '@foodhubme/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CatalogQueryInputDto {
  @ApiPropertyOptional({
    enum: CatalogSort,
    description:
      'Сортировка. По умолчанию — name. delivery = по рейтингу доставки ' +
      '(времени доставки в базе пока нет, ETA — Этап 8).',
  })
  @IsOptional()
  @IsEnum(CatalogSort, { message: 'sort: name, rating, reviews или delivery' })
  sort?: CatalogSort;

  @ApiPropertyOptional({
    example: 'Суши',
    description: 'Кухня — точное значение из cuisineTypes бренда.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cuisine?: string;

  @ApiPropertyOptional({
    example: 'grozny',
    description: 'Slug города: бренды, у которых есть активная точка в нём.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  city?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'true — только открытые сейчас (по графику точек).',
  })
  @IsOptional()
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const raw = obj[key];
    if (raw === 'true' || raw === true) return true;
    if (raw === 'false' || raw === false) return false;
    return raw;
  })
  @IsBoolean({ message: 'open: true или false' })
  open?: boolean;
}
