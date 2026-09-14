import type { OtpChannelPreference } from '@foodhubme/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, Matches } from 'class-validator';
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

  @ApiPropertyOptional({
    enum: ['auto', 'sms'],
    default: 'auto',
    description:
      'Чем прислать код. auto — решает сервер (сначала Telegram, дешевле). ' +
      'sms — кнопка «Не пришёл код? Отправить по СМС»: человек уже сказал, ' +
      'что первый канал ему не подошёл, и уговаривать его незачем.',
  })
  @IsOptional()
  @IsIn(['auto', 'sms'], { message: 'channel: auto или sms' })
  channel?: OtpChannelPreference;
}
