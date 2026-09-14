import { Logger } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { WS_NAMESPACES } from '@foodhubme/shared';
import { AuthenticatedGateway } from './authenticated.gateway';
import { WsAuthService } from '../ws-auth.service';

@WebSocketGateway({ namespace: WS_NAMESPACES.RESTAURANT })
export class RestaurantGateway extends AuthenticatedGateway {
  protected readonly allowedRoles = [
    Role.RESTAURANT_OWNER,
    Role.RESTAURANT_STAFF,
  ];
  protected readonly logger = new Logger(RestaurantGateway.name);

  constructor(wsAuth: WsAuthService) {
    super(wsAuth);
  }
}
