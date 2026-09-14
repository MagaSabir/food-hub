import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../../queues/queue-names';
import { OtpRepository } from '../repositories/otp.repository';
import { IOtpSender, OTP_CHANNEL } from './otp-sender.interface';
import { SendOtpJob } from './queued-otp-sender';

@Processor(QUEUES.OTP_DELIVERY)
export class OtpDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(OtpDeliveryProcessor.name);

  constructor(
    @Inject(OTP_CHANNEL) private readonly channel: IOtpSender,
    private readonly otp: OtpRepository,
  ) {
    super();
  }

  async process(job: Job<SendOtpJob>): Promise<void> {
    const { phone, code, preference } = job.data;

    await this.channel.send(phone, code, preference);
  }

  @OnWorkerEvent('failed')
  async onFailed(
    job: Job<SendOtpJob> | undefined,
    error: Error,
  ): Promise<void> {
    if (!job) return;

    const attemptsLeft = (job.opts.attempts ?? 1) - job.attemptsMade;
    if (attemptsLeft > 0) {
      this.logger.warn(
        `Код на ${job.data.phone} не ушёл (${error.message}), попробуем ещё раз`,
      );
      return;
    }

    this.logger.error(
      `Код на ${job.data.phone} не доставлен после ${job.attemptsMade} попыток: ${error.message}`,
    );

    await this.otp.releaseCooldown(job.data.phone);
  }
}
