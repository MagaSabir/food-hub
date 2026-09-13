import { ApiProperty } from '@nestjs/swagger';
import type { ErrorResponseBody } from '../filters/all-exceptions.filter';

export class ErrorExtensionViewDto {
  @ApiProperty({ example: 'Некорректный email' })
  message!: string;

  @ApiProperty({ example: 'email' })
  field!: string;
}

export class ErrorResponseViewDto implements ErrorResponseBody {
  @ApiProperty({ example: 401 })
  statusCode!: number;

  @ApiProperty({ example: 'Unauthorized' })
  error!: string;

  @ApiProperty({ example: 'Неверный email или пароль' })
  message!: string | string[];

  @ApiProperty({
    required: false,
    example: 'INVALID_CREDENTIALS',
    description: 'Стабильный машиночитаемый код — по нему клиент ветвит логику',
  })
  code?: string;

  @ApiProperty({ required: false, type: [ErrorExtensionViewDto] })
  extensions?: ErrorExtensionViewDto[];

  @ApiProperty({ example: '/api/auth/login' })
  path!: string;

  @ApiProperty({ example: '2026-07-29T10:15:00.000Z' })
  timestamp!: string;
}
