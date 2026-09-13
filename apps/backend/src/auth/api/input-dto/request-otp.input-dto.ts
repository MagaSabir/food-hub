import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';
import { normalizePhone } from '../../domain/rules/phone';

export class RequestOtpInputDto {
  @ApiProperty({
    example: '+79280000000',
    description:
      'Российский номер. Принимаем любую запись (+7…, 8…, с пробелами ' +
      'и скобками) — сервер приводит к виду +7XXXXXXXXXX.',
  })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? (normalizePhone(value) ?? value) : value,
  )
  @Matches(/^\+7\d{10}$/, { message: 'Некорректный номер телефона' })
  phone!: string;
}
