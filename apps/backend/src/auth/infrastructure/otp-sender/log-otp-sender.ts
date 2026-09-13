import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IOtpSender } from './otp-sender.interface';

@Injectable()
export class LogOtpSender implements IOtpSender, OnModuleInit {
  private readonly logger = new Logger('OTP');

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'LogOtpSender запрещён в production: коды попадут в лог вместо SMS. ' +
          'Подключите реальный адаптер в OTP_SENDER.',
      );
    }
  }

  send(phone: string, code: string): Promise<void> {
    this.logger.log(`Код для ${phone}: ${code}`);

    return Promise.resolve();
  }
}
