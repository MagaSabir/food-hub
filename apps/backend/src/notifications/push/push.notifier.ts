import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JOBS, QUEUES } from '../../queues/queue-names';
import { PushMessage } from './push-channel.interface';
import { PushPolicy } from './push.policy';

export interface SendPushJob {
  userId: string;
  message: PushMessage;
}

@Injectable()
export class PushNotifier {
  private readonly logger = new Logger(PushNotifier.name);

  constructor(
    @InjectQueue(QUEUES.PUSH) private readonly queue: Queue<SendPushJob>,
  ) {}

  async notify(userId: string, message: PushMessage): Promise<void> {
    try {
      await this.queue.add(
        JOBS.SEND_PUSH,
        { userId, message },
        {
          attempts: PushPolicy.DELIVERY_ATTEMPTS,
          backoff: {
            type: 'exponential',
            delay: PushPolicy.DELIVERY_BACKOFF_MS,
          },
        },
      );
    } catch (e) {
      this.logger.error(
        `Не удалось поставить push для ${userId}: ${(e as Error).message}`,
      );
    }
  }
}
