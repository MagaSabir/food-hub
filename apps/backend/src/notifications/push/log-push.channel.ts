import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  IPushChannel,
  PushDelivery,
  PushMessage,
} from './push-channel.interface';

@Injectable()
export class LogPushChannel implements IPushChannel, OnModuleInit {
  private readonly logger = new Logger('PUSH');

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'LogPushChannel запрещён в production: уведомления попадут в лог ' +
          'вместо телефонов. Подключите ExpoPushChannel в PUSH_CHANNEL.',
      );
    }
  }

  send(tokens: string[], message: PushMessage): Promise<PushDelivery[]> {
    this.logger.log(
      `${message.title} — ${message.body} (устройств: ${tokens.length})`,
    );

    return Promise.resolve(tokens.map((token) => ({ token, ok: true })));
  }
}
