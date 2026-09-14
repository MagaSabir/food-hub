import { Logger } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { WS_NAMESPACES } from '@foodhubme/shared';
import { AuthenticatedGateway } from './authenticated.gateway';
import { WsAuthService } from '../ws-auth.service';

@WebSocketGateway({ namespace: WS_NAMESPACES.CLIENT })
export class ClientGateway extends AuthenticatedGateway {
  protected readonly allowedRoles = [Role.CLIENT];
  protected readonly logger = new Logger(ClientGateway.name);

  constructor(wsAuth: WsAuthService) {
    super(wsAuth);
  }
}
