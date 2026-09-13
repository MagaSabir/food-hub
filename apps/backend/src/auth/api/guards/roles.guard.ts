import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import {
  AccessDeniedError,
  InvalidAccessTokenError,
} from '../../domain/errors/auth.errors';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestWithUser } from './access-token.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    if (!user) {
      throw new InvalidAccessTokenError();
    }

    if (!required.includes(user.role)) {
      throw new AccessDeniedError();
    }

    return true;
  }
}
