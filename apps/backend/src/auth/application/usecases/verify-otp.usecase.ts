import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthSubjectType, AuthTokens } from '../../domain/types/auth-subject';
import {
  InvalidOtpError,
  OtpAttemptsExceededError,
} from '../../domain/errors/auth.errors';
import { clientAccessPayload } from '../../domain/rules/build-access-payload';
import { OtpPolicy } from '../../domain/policies/otp.policy';
import { OtpRepository } from '../../infrastructure/repositories/otp.repository';
import { PasswordHasher } from '../../infrastructure/crypto/password-hasher';
import { SessionsRepository } from '../../infrastructure/repositories/sessions.repository';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';
import { SessionIssuer } from '../services/session-issuer.service';

export class VerifyOtpCommand extends Command<AuthTokens> {
  constructor(
    public readonly phone: string,
    public readonly code: string,
  ) {
    super();
  }
}

@CommandHandler(VerifyOtpCommand)
export class VerifyOtpUseCase implements ICommandHandler<
  VerifyOtpCommand,
  AuthTokens
> {
  constructor(
    private readonly otp: OtpRepository,
    private readonly hasher: PasswordHasher,
    private readonly users: UsersRepository,
    private readonly sessions: SessionsRepository,
    private readonly issuer: SessionIssuer,
  ) {}

  async execute({ phone, code }: VerifyOtpCommand): Promise<AuthTokens> {
    await this.assertCode(phone, code);

    await this.otp.deleteCode(phone);

    const user = await this.users.findOrCreateByPhone(phone);

    await this.sessions.deleteAllForSubject(AuthSubjectType.CLIENT, user.id);

    return this.issuer.issue(AuthSubjectType.CLIENT, clientAccessPayload(user));
  }

  private async assertCode(phone: string, code: string): Promise<void> {
    const storedHashes = await this.otp.findCodeHashes(phone);

    if (storedHashes.length === 0) {
      throw new InvalidOtpError();
    }

    const attempts = await this.otp.incrementAttempts(phone);
    if (attempts > OtpPolicy.MAX_ATTEMPTS) {
      await this.otp.deleteCode(phone);
      throw new OtpAttemptsExceededError();
    }

    if (!(await this.matchesAny(storedHashes, code))) {
      throw new InvalidOtpError();
    }
  }

  private async matchesAny(hashes: string[], code: string): Promise<boolean> {
    for (const hash of hashes) {
      if (await this.hasher.verify(hash, code)) return true;
    }

    return false;
  }
}
