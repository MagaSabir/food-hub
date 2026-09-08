import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthTokensViewDto } from '../../api/view-dto/auth-tokens.view-dto';
import { LoginApplicationDto } from '../dto/login.application.dto';
import { StaffUsersRepository } from '../../infrastructure/repositories/staff-users.repository';
import { PlatformAdminsRepository } from '../../infrastructure/repositories/platform-admins.repository';
import {
  DUMMY_PASSWORD_HASH,
  PasswordHasher,
} from '../../infrastructure/crypto/password-hasher';
import { AuthScope } from '@foodhubme/shared';
import { InvalidCredentialsError } from '../../domain/errors/auth.errors';

export class LoginCommand extends Command<AuthTokensViewDto> {
  constructor(public readonly dto: LoginApplicationDto) {
    super();
  }
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly staffUsers: StaffUsersRepository,
    private readonly platformAdmins: PlatformAdminsRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute({ dto }: LoginCommand): Promise<AuthTokensViewDto> {
    const account =
      dto.scope === AuthScope.PLATFORM
        ? await this.platformAdmins.findByEmail(dto.email)
        : await this.staffUsers.findByEmail(dto.email);

    const passwordHash = account?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordOk = await this.hasher.verify(passwordHash, dto.password);

    if (!account || !passwordOk) {
      throw new InvalidCredentialsError();
    }
    return AuthTokensViewDto.create('later');
  }
}
