import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenPayload } from '../../domain/types/access-token-payload';
import { InvalidAccessTokenError } from '../../domain/errors/auth.errors';
import { RequestWithUser } from '../guards/access-token.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenPayload => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new InvalidAccessTokenError();
    }

    return request.user;
  },
);
