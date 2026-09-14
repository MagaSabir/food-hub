import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IOtpChannel, OtpChannelName } from '../otp-sender.interface';

@Injectable()
export class MockTelegramChannel implements IOtpChannel, OnModuleInit {
  readonly name: OtpChannelName = 'telegram';

  private readonly logger = new Logger('OTP:telegram');

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'MockTelegramChannel запрещён в production: это заглушка, которая ' +
          'никогда не доставляет. Подключите настоящий Telegram Gateway.',
      );
    }
  }

  send(phone: string): Promise<boolean> {
    this.logger.debug(`заглушка: у ${phone} нет Telegram, пробуем дальше`);

    return Promise.resolve(false);
  }
}
