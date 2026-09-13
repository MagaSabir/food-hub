import { ApiProperty } from '@nestjs/swagger';
import type { OtpRequested } from '@foodhubme/shared';
import { OtpRequestResult } from '../../application/usecases/request-otp.usecase';

export class OtpRequestedViewDto implements OtpRequested {
  @ApiProperty({
    example: 60,
    description: 'Через сколько секунд можно повторить',
  })
  cooldownSec!: number;

  @ApiProperty({ example: 300, description: 'Сколько секунд действует код' })
  expiresInSec!: number;

  static create(result: OtpRequestResult): OtpRequestedViewDto {
    const dto = new OtpRequestedViewDto();
    dto.cooldownSec = result.cooldownSec;
    dto.expiresInSec = result.expiresInSec;
    return dto;
  }
}
