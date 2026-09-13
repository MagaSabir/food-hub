import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { InvalidRefreshTokenError } from '../../domain/errors/auth.errors';
import { RefreshSession } from '../../domain/types/refresh-session';
import { RequestWithRefreshSession } from '../guards/refresh-token.guard';

export const CurrentRefreshSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RefreshSession => {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithRefreshSession>();

    if (!request.refreshSession) {
      throw new InvalidRefreshTokenError();
    }

    return request.refreshSession;
  },
);
