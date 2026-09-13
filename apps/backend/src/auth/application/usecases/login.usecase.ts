import { AuthScope } from '@foodhubme/shared';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AccessTokenPayload } from '../../domain/types/access-token-payload';
import { AuthSubjectType, AuthTokens } from '../../domain/types/auth-subject';
import {
  InvalidCredentialsError,
  LoginAttemptsExceededError,
} from '../../domain/errors/auth.errors';
import {
  adminAccessPayload,
  staffAccessPayload,
} from '../../domain/rules/build-access-payload';
import {
  DUMMY_PASSWORD_HASH,
  PasswordHasher,
} from '../../infrastructure/crypto/password-hasher';
import { LoginAttemptsRepository } from '../../infrastructure/repositories/login-attempts.repository';
import { PlatformAdminsRepository } from '../../infrastructure/repositories/platform-admins.repository';
import { SessionsRepository } from '../../infrastructure/repositories/sessions.repository';
import { StaffUsersRepository } from '../../infrastructure/repositories/staff-users.repository';
import { SessionIssuer } from '../services/session-issuer.service';
import { LoginApplicationDto } from '../dto/login.application.dto';

export class LoginCommand extends Command<AuthTokens> {
  constructor(public readonly dto: LoginApplicationDto) {
    super();
  }
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand, AuthTokens> {
  constructor(
    private readonly staffUsers: StaffUsersRepository,
    private readonly platformAdmins: PlatformAdminsRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionsRepository,
    private readonly issuer: SessionIssuer,
    private readonly attempts: LoginAttemptsRepository,
  ) {}

  async execute({ dto }: LoginCommand): Promise<AuthTokens> {
    const subjectType =
      dto.scope === AuthScope.PLATFORM
        ? AuthSubjectType.ADMIN
        : AuthSubjectType.STAFF;

    const lockedFor = await this.attempts.lockedForSec(subjectType, dto.email);
    if (lockedFor > 0) {
      throw new LoginAttemptsExceededError(lockedFor);
    }

    const payload = await this.authenticate(
      subjectType,
      dto.email,
      dto.password,
    );

    await this.attempts.reset(subjectType, dto.email);

    await this.sessions.deleteAllForSubject(subjectType, payload.sub);

    return this.issuer.issue(subjectType, payload);
  }

  private async authenticate(
    subjectType: AuthSubjectType,
    email: string,
    password: string,
  ): Promise<AccessTokenPayload> {
    try {
      return subjectType === AuthSubjectType.ADMIN
        ? await this.authenticatePlatformAdmin(email, password)
        : await this.authenticateStaffUser(email, password);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        await this.attempts.registerFailure(subjectType, email);
      }

      throw error;
    }
  }

  private async authenticatePlatformAdmin(
    email: string,
    password: string,
  ): Promise<AccessTokenPayload> {
    const admin = await this.platformAdmins.findActiveByEmail(email);
    await this.assertPassword(password, admin?.passwordHash);

    return adminAccessPayload(admin!);
  }

  private async authenticateStaffUser(
    email: string,
    password: string,
  ): Promise<AccessTokenPayload> {
    const staff = await this.staffUsers.findActiveByEmail(email);
    await this.assertPassword(password, staff?.passwordHash);

    return staffAccessPayload(staff!);
  }

  private async assertPassword(
    password: string,
    passwordHash: string | undefined,
  ): Promise<void> {
    const matches = await this.hasher.verify(
      passwordHash ?? DUMMY_PASSWORD_HASH,
      password,
    );

    if (!passwordHash || !matches) {
      throw new InvalidCredentialsError();
    }
  }
}
