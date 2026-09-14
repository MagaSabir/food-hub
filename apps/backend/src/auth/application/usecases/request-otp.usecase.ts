import { randomInt } from 'node:crypto';
import { OtpChannelPreference } from '@foodhubme/shared';
import { Inject } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  OtpLimitExceededError,
  OtpTooSoonError,
} from '../../domain/errors/auth.errors';
import { OtpPolicy } from '../../domain/policies/otp.policy';
import { OtpRepository } from '../../infrastructure/repositories/otp.repository';
import { PasswordHasher } from '../../infrastructure/crypto/password-hasher';
import {
  IOtpSender,
  OTP_SENDER,
} from '../../infrastructure/otp-sender/otp-sender.interface';

export interface OtpRequestResult {
  cooldownSec: number;
  expiresInSec: number;
}

export class RequestOtpCommand extends Command<OtpRequestResult> {
  constructor(
    public readonly phone: string,
    public readonly preference: OtpChannelPreference = 'auto',
  ) {
    super();
  }
}

@CommandHandler(RequestOtpCommand)
export class RequestOtpUseCase implements ICommandHandler<
  RequestOtpCommand,
  OtpRequestResult
> {
  constructor(
    private readonly otp: OtpRepository,
    private readonly hasher: PasswordHasher,
    @Inject(OTP_SENDER) private readonly sender: IOtpSender,
  ) {}

  async execute({
    phone,
    preference,
  }: RequestOtpCommand): Promise<OtpRequestResult> {
    const cooldownLeft = await this.otp.startCooldown(phone);
    if (cooldownLeft > 0) {
      throw new OtpTooSoonError(cooldownLeft);
    }

    try {
      const count = await this.otp.incrementHourlyCount(phone);
      if (count > OtpPolicy.MAX_PER_HOUR) {
        throw new OtpLimitExceededError();
      }

      const code = this.generateCode();

      await this.otp.addCode(phone, await this.hasher.hash(code));

      await this.sender.send(phone, code, preference);
    } catch (error) {
      await this.otp.releaseCooldown(phone);
      throw error;
    }

    return {
      cooldownSec: OtpPolicy.COOLDOWN_SEC,
      expiresInSec: OtpPolicy.TTL_SEC,
    };
  }

  private generateCode(): string {
    const max = 10 ** OtpPolicy.CODE_LENGTH;

    return String(randomInt(0, max)).padStart(OtpPolicy.CODE_LENGTH, '0');
  }
}
