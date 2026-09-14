import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { OrderStatus } from '@foodhubme/shared';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../auth/api/decorators/current-user.decorator';
import { Roles } from '../../auth/api/decorators/roles.decorator';
import { staffScope } from '../../auth/domain/rules/staff-scope';
import { AccessTokenPayload } from '../../auth/domain/types/access-token-payload';
import { GetRestaurantOrderByIdQuery } from '../application/queries/get-restaurant-order-by-id.query';
import { GetRestaurantOrdersQuery } from '../application/queries/get-restaurant-orders.query';
import { ChangeOrderStatusDto } from '../application/dto/change-order-status.application.dto';
import { ChangeOrderStatusCommand } from '../application/usecases/change-order-status.usecase';
import {
  ApiAcceptOrder,
  ApiChangeOrderStatus,
  ApiRejectOrder,
} from './docs/order-actions.docs';
import {
  ApiGetRestaurantOrderById,
  ApiGetRestaurantOrders,
} from './docs/restaurant-orders.docs';
import {
  AcceptOrderInputDto,
  ChangeOrderStatusInputDto,
  RejectOrderInputDto,
} from './input-dto/order-actions.input-dto';
import { RestaurantOrdersQueryInputDto } from './input-dto/restaurant-orders-query.input-dto';
import { OrderViewDto } from './view-dto/order.view-dto';
import { RestaurantOrderListItemViewDto } from './view-dto/restaurant-order-list-item.view-dto';

@ApiTags('restaurant-orders')
@Roles(Role.RESTAURANT_OWNER, Role.RESTAURANT_STAFF)
@Controller('admin/restaurant/orders')
export class RestaurantOrdersController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @ApiGetRestaurantOrders()
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: RestaurantOrdersQueryInputDto,
  ): Promise<RestaurantOrderListItemViewDto[]> {
    return this.queryBus.execute(
      new GetRestaurantOrdersQuery(staffScope(user), query.status ?? null),
    );
  }

  @Get(':id')
  @ApiGetRestaurantOrderById()
  byId(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderViewDto> {
    return this.queryBus.execute(
      new GetRestaurantOrderByIdQuery(staffScope(user), id),
    );
  }
  @Patch(':id/accept')
  @ApiAcceptOrder()
  accept(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AcceptOrderInputDto,
  ): Promise<OrderViewDto> {
    return this.commandBus.execute(
      new ChangeOrderStatusCommand(
        this.action(user, id, {
          status: OrderStatus.ACCEPTED,
          prepMinutes: body.prepMinutes,
        }),
      ),
    );
  }

  @Patch(':id/reject')
  @ApiRejectOrder()
  reject(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RejectOrderInputDto,
  ): Promise<OrderViewDto> {
    return this.commandBus.execute(
      new ChangeOrderStatusCommand(
        this.action(user, id, {
          status: OrderStatus.CANCELLED,
          cancelReason: body.reason,
        }),
      ),
    );
  }

  @Patch(':id/status')
  @ApiChangeOrderStatus()
  changeStatus(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ChangeOrderStatusInputDto,
  ): Promise<OrderViewDto> {
    return this.commandBus.execute(
      new ChangeOrderStatusCommand(
        this.action(user, id, { status: body.status }),
      ),
    );
  }

  private action(
    user: AccessTokenPayload,
    orderId: string,
    action: ChangeOrderStatusDto['action'],
  ): ChangeOrderStatusDto {
    return {
      scope: staffScope(user),
      staffUserId: user.sub,
      orderId,
      action,
    };
  }
}
