import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AccessTokenPayload } from '../../domain/types/access-token-payload';
import { AuthSubjectType, AuthTokens } from '../../domain/types/auth-subject';
import { InvalidRefreshTokenError } from '../../domain/errors/auth.errors';
import {
  adminAccessPayload,
  clientAccessPayload,
  staffAccessPayload,
} from '../../domain/rules/build-access-payload';
import { RefreshSession } from '../../domain/types/refresh-session';
import { PlatformAdminsRepository } from '../../infrastructure/repositories/platform-admins.repository';
import {
  SessionsRepository,
  SessionState,
} from '../../infrastructure/repositories/sessions.repository';
import { StaffUsersRepository } from '../../infrastructure/repositories/staff-users.repository';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';
import { SessionIssuer } from '../services/session-issuer.service';

export class RefreshTokenCommand extends Command<AuthTokens> {
  constructor(public readonly session: RefreshSession) {
    super();
  }
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCase implements ICommandHandler<
  RefreshTokenCommand,
  AuthTokens
> {
  constructor(
    private readonly sessions: SessionsRepository,
    private readonly staffUsers: StaffUsersRepository,
    private readonly platformAdmins: PlatformAdminsRepository,
    private readonly users: UsersRepository,
    private readonly issuer: SessionIssuer,
  ) {}

  async execute({ session }: RefreshTokenCommand): Promise<AuthTokens> {
    const { subjectType, subjectId, sessionId, token } = session;

    const state = await this.sessions.check(
      subjectType,
      subjectId,
      sessionId,
      token,
    );

    if (state === SessionState.STALE) {
      await this.sessions.deleteAllForSubject(subjectType, subjectId);
      throw new InvalidRefreshTokenError();
    }

    if (state === SessionState.MISSING) {
      throw new InvalidRefreshTokenError();
    }

    const payload = await this.loadAccessPayload(subjectType, subjectId);

    return this.issuer.issue(subjectType, payload, sessionId);
  }

  private async loadAccessPayload(
    subjectType: AuthSubjectType,
    subjectId: string,
  ): Promise<AccessTokenPayload> {
    if (subjectType === AuthSubjectType.ADMIN) {
      const admin = await this.platformAdmins.findActiveById(subjectId);
      if (!admin) throw new InvalidRefreshTokenError();

      return adminAccessPayload(admin);
    }

    if (subjectType === AuthSubjectType.CLIENT) {
      const user = await this.users.findActiveById(subjectId);
      if (!user) throw new InvalidRefreshTokenError();

      return clientAccessPayload(user);
    }

    const staff = await this.staffUsers.findActiveById(subjectId);
    if (!staff) throw new InvalidRefreshTokenError();

    return staffAccessPayload(staff);
  }
}
