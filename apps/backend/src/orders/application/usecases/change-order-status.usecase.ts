import { OrderStatus, OrderType } from '@foodhubme/shared';
import { Logger } from '@nestjs/common';
import {
  Command,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { StaffScope } from '../../../auth/domain/rules/staff-scope';
import { OrderViewDto } from '../../api/view-dto/order.view-dto';
import {
  OrderNotFoundError,
  OrderStatusConflictError,
} from '../../domain/errors/orders.errors';
import { canTransition, hasReached } from '../../domain/rules/order-status';
import { StatusActor } from '../../domain/rules/status-actor';
import { OrdersRepository } from '../../infrastructure/repositories/orders.repository';
import {
  ChangeOrderStatusDto,
  OrderStatusAction,
} from '../dto/change-order-status.application.dto';
import { OrderStatusChangedEvent } from '../events/order-status-changed.event';

export class ChangeOrderStatusCommand extends Command<OrderViewDto> {
  constructor(public readonly dto: ChangeOrderStatusDto) {
    super();
  }
}

@CommandHandler(ChangeOrderStatusCommand)
export class ChangeOrderStatusUseCase implements ICommandHandler<
  ChangeOrderStatusCommand,
  OrderViewDto
> {
  private readonly logger = new Logger(ChangeOrderStatusUseCase.name);

  constructor(
    private readonly orders: OrdersRepository,
    private readonly events: EventBus,
  ) {}

  async execute({ dto }: ChangeOrderStatusCommand): Promise<OrderViewDto> {
    const card = await this.apply(
      dto.scope,
      dto.orderId,
      dto.action,
      StatusActor.staff(dto.staffUserId),
    );

    if (dto.action.status !== OrderStatus.ACCEPTED) return card;

    return this.startPreparing(dto, card);
  }

  private async apply(
    scope: StaffScope,
    orderId: string,
    action: OrderStatusAction,
    changedBy: string,
  ): Promise<OrderViewDto> {
    const order = await this.orders.findForStatusChange(scope, orderId);

    if (order === null) throw new OrderNotFoundError(orderId);

    const orderType = order.orderType as OrderType;
    const from = order.status as OrderStatus;
    const to = action.status;

    if (hasReached(orderType, from, to)) return this.card(orderId, scope);

    if (!canTransition(orderType, from, to)) {
      throw new OrderStatusConflictError(from, to);
    }

    const updated = await this.orders.changeStatus({
      orderId,
      scope,
      expectedFrom: from,
      status: to,
      changedBy,
      ...extraFields(action),
    });

    if (updated !== null) {
      this.events.publish(
        new OrderStatusChangedEvent({
          id: updated.id,
          orderNumber: updated.orderNumber,
          status: to,
          userId: updated.userId,
          restaurantId: updated.restaurantId,
          branchId: updated.branchId,
          prepMinutes: updated.prepMinutes,
          cancelReason: updated.cancelReason,
        }),
      );

      return OrderViewDto.mapToView(updated);
    }

    return this.resolveRace(scope, orderId, orderType, to);
  }

  private async resolveRace(
    scope: StaffScope,
    orderId: string,
    orderType: OrderType,
    target: OrderStatus,
  ): Promise<OrderViewDto> {
    const order = await this.orders.findForStatusChange(scope, orderId);
    if (order === null) throw new OrderNotFoundError(orderId);

    const current = order.status as OrderStatus;

    if (hasReached(orderType, current, target)) {
      return this.card(orderId, scope);
    }

    throw new OrderStatusConflictError(current, target);
  }

  private async startPreparing(
    dto: ChangeOrderStatusDto,
    accepted: OrderViewDto,
  ): Promise<OrderViewDto> {
    try {
      return await this.apply(
        dto.scope,
        dto.orderId,
        { status: OrderStatus.PREPARING },
        StatusActor.SYSTEM,
      );
    } catch (e) {
      this.logger.warn(
        `Заказ ${dto.orderId} принят, но не пошёл в работу: ${(e as Error).message}`,
      );

      return accepted;
    }
  }

  private async card(
    orderId: string,
    scope: StaffScope,
  ): Promise<OrderViewDto> {
    const card = await this.orders.findCardForStaff(scope, orderId);
    if (card === null) throw new OrderNotFoundError(orderId);

    return OrderViewDto.mapToView(card);
  }
}

function extraFields(action: OrderStatusAction): {
  prepMinutes?: number;
  cancelReason?: string;
} {
  switch (action.status) {
    case OrderStatus.ACCEPTED:
      return { prepMinutes: action.prepMinutes };
    case OrderStatus.CANCELLED:
      return { cancelReason: action.cancelReason };
    default:
      return {};
  }
}
