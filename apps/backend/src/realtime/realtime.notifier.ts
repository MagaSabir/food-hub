import { Injectable, Logger } from '@nestjs/common';
import { ClientGateway } from './gateways/client.gateway';
import { RestaurantGateway } from './gateways/restaurant.gateway';
import { clientRoom, roomsForBranchOrder } from './rooms';

export interface BranchTarget {
  restaurantId: string;
  branchId: string;
}

@Injectable()
export class RealtimeNotifier {
  private readonly logger = new Logger(RealtimeNotifier.name);

  constructor(
    private readonly restaurant: RestaurantGateway,
    private readonly client: ClientGateway,
  ) {}

  emitToBranch(target: BranchTarget, event: string, payload: unknown): void {
    const rooms = roomsForBranchOrder(target.restaurantId, target.branchId);

    try {
      this.restaurant.namespace.to(rooms).emit(event, payload);
    } catch (e) {
      this.logger.error(
        `Не удалось отправить ${event} в ${rooms.join(', ')}: ${(e as Error).message}`,
      );
    }
  }
  emitToClient(userId: string, event: string, payload: unknown): void {
    const room = clientRoom(userId);

    try {
      this.client.namespace.to(room).emit(event, payload);
    } catch (e) {
      this.logger.error(
        `Не удалось отправить ${event} в ${room}: ${(e as Error).message}`,
      );
    }
  }
}
