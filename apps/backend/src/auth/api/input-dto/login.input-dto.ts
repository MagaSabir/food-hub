import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AuthScope } from '@foodhubme/shared';

export class LoginInputDto {
  @ApiProperty({ example: 'admin@foodhub.local' })
  @IsEmail({}, { message: 'Некоректный емаил' })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'admin', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({
    enum: AuthScope,
    example: AuthScope.PLATFORM,
    description:
      'Куда входим: restaurant — сотрудник ресторана, platform — админ платформы',
  })
  @IsEnum(AuthScope, { message: 'scope: restaurant или platform' })
  scope!: AuthScope;
}
