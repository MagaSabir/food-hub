import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MeViewDto } from '../../api/view-dto/me.view-dto';
import { InvalidAccessTokenError } from '../../domain/errors/auth.errors';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';

export class UpdateProfileCommand extends Command<MeViewDto> {
  constructor(
    public readonly userId: string,
    public readonly name: string,
  ) {
    super();
  }
}

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileUseCase implements ICommandHandler<
  UpdateProfileCommand,
  MeViewDto
> {
  constructor(private readonly users: UsersRepository) {}

  async execute({ userId, name }: UpdateProfileCommand): Promise<MeViewDto> {
    const updated = await this.users.updateName(userId, name);

    if (updated === null) throw new InvalidAccessTokenError();

    return MeViewDto.fromUser(updated);
  }
}
