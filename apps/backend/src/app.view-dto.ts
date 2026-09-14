import { ApiProperty } from '@nestjs/swagger';

export class AppInfoViewDto {
  @ApiProperty({ example: 'FoodHub API' })
  name!: string;

  @ApiProperty({
    example: 'development',
    description: 'NODE_ENV: development | test | production',
  })
  env!: string;

  @ApiProperty({
    example: 'ok',
    description: 'Заглушка; настоящая проверка — GET /health',
  })
  status!: string;
}
