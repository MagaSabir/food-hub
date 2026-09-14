import { AuthScope } from '@foodhubme/shared';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginInputDto {
  @ApiProperty({ example: 'admin@foodhub.local' })
  @IsEmail({}, { message: 'Некорректный email' })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'Admin12345!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Пароль не короче 8 символов' })
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
