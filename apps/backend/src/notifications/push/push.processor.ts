import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../queues/queue-names';
import { DevicesService } from '../devices.service';
import {
  DEVICE_NOT_REGISTERED,
  IPushChannel,
  PUSH_CHANNEL,
} from './push-channel.interface';
import { SendPushJob } from './push.notifier';

@Processor(QUEUES.PUSH)
export class PushProcessor extends WorkerHost {
  private readonly logger = new Logger(PushProcessor.name);

  constructor(
    @Inject(PUSH_CHANNEL) private readonly channel: IPushChannel,
    private readonly devices: DevicesService,
  ) {
    super();
  }

  async process(job: Job<SendPushJob>): Promise<void> {
    const { userId, message } = job.data;

    const tokens = await this.devices.tokensOf(userId);

    if (tokens.length === 0) return;

    const results = await this.channel.send(tokens, message);

    const dead = results
      .filter((r) => r.error === DEVICE_NOT_REGISTERED)
      .map((r) => r.token);

    if (dead.length > 0) {
      await this.devices.forget(dead);
      this.logger.log(`Забыли устройств: ${dead.length} (нет приложения)`);
    }
  }
}
