import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RefreshSession } from '../../domain/types/refresh-session';
import { SessionsRepository } from '../../infrastructure/repositories/sessions.repository';

export class LogoutCommand extends Command<void> {
  constructor(public readonly session: RefreshSession) {
    super();
  }
}

@CommandHandler(LogoutCommand)
export class LogoutUseCase implements ICommandHandler<LogoutCommand, void> {
  constructor(private readonly sessions: SessionsRepository) {}

  async execute({ session }: LogoutCommand): Promise<void> {
    await this.sessions.delete(
      session.subjectType,
      session.subjectId,
      session.sessionId,
    );
  }
}
