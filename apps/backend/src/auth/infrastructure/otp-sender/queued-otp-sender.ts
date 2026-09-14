import { OtpChannelPreference } from '@foodhubme/shared';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JOBS, QUEUES } from '../../../queues/queue-names';
import { OtpPolicy } from '../../domain/policies/otp.policy';
import { IOtpSender } from './otp-sender.interface';

export interface SendOtpJob {
  phone: string;
  code: string;
  preference: OtpChannelPreference;
}

@Injectable()
export class QueuedOtpSender implements IOtpSender {
  constructor(
    @InjectQueue(QUEUES.OTP_DELIVERY) private readonly queue: Queue<SendOtpJob>,
  ) {}

  async send(
    phone: string,
    code: string,
    preference: OtpChannelPreference,
  ): Promise<void> {
    await this.queue.add(
      JOBS.SEND_OTP,
      { phone, code, preference },
      {
        attempts: OtpPolicy.DELIVERY_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: OtpPolicy.DELIVERY_BACKOFF_MS,
        },
      },
    );
  }
}
