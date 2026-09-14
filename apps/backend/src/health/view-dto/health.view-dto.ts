import { ApiProperty } from '@nestjs/swagger';
import type { HealthResult } from '../health.service';

export class HealthViewDto implements HealthResult {
  @ApiProperty({
    enum: ['ok', 'error'],
    example: 'ok',
    description: 'error, если лежит хотя бы одна обязательная зависимость',
  })
  status!: 'ok' | 'error';

  @ApiProperty({
    enum: ['up', 'down'],
    example: 'up',
    description: 'PostgreSQL (SELECT 1)',
  })
  db!: 'up' | 'down';

  @ApiProperty({
    enum: ['up', 'down'],
    example: 'up',
    description: 'Redis (PING)',
  })
  redis!: 'up' | 'down';

  @ApiProperty({ example: 1234, description: 'Сколько секунд процесс живёт' })
  uptimeSec!: number;

  @ApiProperty({
    example: '2026-08-04T02:30:00.000Z',
    description: 'Момент проверки, ISO 8601',
  })
  timestamp!: string;
}
