import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IOtpChannel, OtpChannelName } from '../otp-sender.interface';

@Injectable()
export class MockSmsChannel implements IOtpChannel, OnModuleInit {
  readonly name: OtpChannelName = 'sms';

  private readonly logger = new Logger('OTP:sms');

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'MockSmsChannel запрещён в production: коды попадут в лог вместо ' +
          'СМС. Подключите реального провайдера.',
      );
    }
  }

  send(phone: string, code: string): Promise<boolean> {
    this.logger.log(`Код для ${phone}: ${code}`);

    return Promise.resolve(true);
  }
}
