import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthTokenService } from '../../application/services/auth-token.service';
import { AccessTokenPayload } from '../../domain/types/access-token-payload';
import { InvalidAccessTokenError } from '../../domain/errors/auth.errors';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface RequestWithUser extends Request {
  user?: AccessTokenPayload;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokens: AuthTokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearer(request);
    if (!token) {
      throw new InvalidAccessTokenError();
    }

    try {
      request.user = await this.tokens.verifyAccess(token);
    } catch {
      throw new InvalidAccessTokenError();
    }

    return true;
  }

  private extractBearer(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) return null;

    const [scheme, token] = header.split(' ');

    return scheme?.toLowerCase() === 'bearer' && token ? token : null;
  }
}
