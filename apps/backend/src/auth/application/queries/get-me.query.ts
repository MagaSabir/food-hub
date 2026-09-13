import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import type { Role } from '@prisma/client';
import { MeViewDto } from '../../api/view-dto/me.view-dto';
import { InvalidAccessTokenError } from '../../domain/errors/auth.errors';
import { AuthQueryRepository } from '../../infrastructure/repositories/auth.query-repository';

export class GetMeQuery extends Query<MeViewDto> {
  constructor(
    public readonly subjectId: string,
    public readonly role: Role,
  ) {
    super();
  }
}

@QueryHandler(GetMeQuery)
export class GetMeQueryHandler implements IQueryHandler<GetMeQuery, MeViewDto> {
  constructor(private readonly queryRepository: AuthQueryRepository) {}

  async execute({ subjectId, role }: GetMeQuery): Promise<MeViewDto> {
    const me = await this.queryRepository.findMe(subjectId, role);

    if (!me) {
      throw new InvalidAccessTokenError();
    }

    return me;
  }
}
