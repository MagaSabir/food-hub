import { OtpChannelPreference } from '@foodhubme/shared';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IOtpChannel, IOtpSender, OTP_CHANNELS } from './otp-sender.interface';

@Injectable()
export class CompositeOtpSender implements IOtpSender {
  private readonly logger = new Logger(CompositeOtpSender.name);

  constructor(@Inject(OTP_CHANNELS) private readonly channels: IOtpChannel[]) {}

  async send(
    phone: string,
    code: string,
    preference: OtpChannelPreference,
  ): Promise<void> {
    const chain = this.chainFor(preference);

    for (const channel of chain) {
      if (await this.tryChannel(channel, phone, code)) return;
    }

    throw new Error(
      `Код на ${phone} не ушёл ни одним каналом (пробовали: ${
        chain.map((c) => c.name).join(', ') || 'нечем'
      })`,
    );
  }

  private chainFor(preference: OtpChannelPreference): IOtpChannel[] {
    if (preference === 'sms') {
      return this.channels.filter((channel) => channel.name === 'sms');
    }

    return this.channels;
  }

  private async tryChannel(
    channel: IOtpChannel,
    phone: string,
    code: string,
  ): Promise<boolean> {
    try {
      const delivered = await channel.send(phone, code);

      if (!delivered) {
        this.logger.log(`${channel.name}: не подходит номеру ${phone}`);
      }

      return delivered;
    } catch (e) {
      this.logger.error(
        `${channel.name}: сбой при отправке на ${phone} — ${(e as Error).message}`,
      );

      return false;
    }
  }
}
