import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';
import { normalizePhone } from '../../domain/rules/phone';
import { OtpPolicy } from '../../domain/policies/otp.policy';

export class VerifyOtpInputDto {
  @ApiProperty({ example: '+79280000000' })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? (normalizePhone(value) ?? value) : value,
  )
  @Matches(/^\+7\d{10}$/, { message: 'Некорректный номер телефона' })
  phone!: string;

  @ApiProperty({
    example: '123456789'.slice(0, OtpPolicy.CODE_LENGTH),
    description: `Код из сообщения, ${OtpPolicy.CODE_LENGTH} цифр`,
  })
  @Matches(new RegExp(`^\\d{${OtpPolicy.CODE_LENGTH}}$`), {
    message: `Код — ${OtpPolicy.CODE_LENGTH} цифр`,
  })
  code!: string;
}
