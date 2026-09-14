import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { ErrorCodes, ErrorCode } from '@foodhubme/shared';
import type {
  DefaultEventsMap,
  ExtendedError,
  Namespace,
  Socket,
} from 'socket.io';
import { AccessTokenPayload } from '../../auth/domain/types/access-token-payload';
import { WsAuthService } from '../ws-auth.service';
import { roomsForConnection } from '../rooms';

export interface RealtimeSocketData {
  user: AccessTokenPayload;
  rooms: string[];
}

export type AuthenticatedSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  RealtimeSocketData
>;

export abstract class AuthenticatedGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  readonly namespace!: Namespace;

  protected abstract readonly allowedRoles: readonly Role[];
  protected abstract readonly logger: Logger;

  constructor(private readonly wsAuth: WsAuthService) {}

  afterInit(namespace: Namespace): void {
    namespace.use((socket, next) => {
      void this.authorize(socket as AuthenticatedSocket, next);
    });
  }

  private async authorize(
    socket: AuthenticatedSocket,
    next: (err?: ExtendedError) => void,
  ): Promise<void> {
    let user: AccessTokenPayload;
    try {
      user = await this.wsAuth.authenticate(socket.handshake);
    } catch {
      next(
        connectError(
          ErrorCodes.INVALID_ACCESS_TOKEN,
          'Не удалось подтвердить токен доступа',
        ),
      );
      return;
    }

    if (!this.allowedRoles.includes(user.role)) {
      next(
        connectError(ErrorCodes.ACCESS_DENIED, 'Нет доступа к этому каналу'),
      );
      return;
    }

    const rooms = roomsForConnection(user);
    if (rooms.length === 0) {
      next(
        connectError(ErrorCodes.ACCESS_DENIED, 'Нет доступа к этому каналу'),
      );
      return;
    }

    socket.data.user = user;
    socket.data.rooms = rooms;
    next();
  }

  handleConnection(socket: AuthenticatedSocket): void {
    const { user, rooms } = socket.data;
    void socket.join(rooms);

    this.logger.log(
      `Подключение ${socket.id}: ${user.role} ${user.sub} → ${rooms.join(', ')}`,
    );
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    this.logger.log(`Отключение ${socket.id}`);
  }
}

function connectError(code: ErrorCode, message: string): ExtendedError {
  const error = new Error(message) as ExtendedError;
  error.data = { code };

  return error;
}
