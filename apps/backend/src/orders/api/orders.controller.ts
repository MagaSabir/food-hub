import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../auth/api/decorators/current-user.decorator';
import { Public } from '../../auth/api/decorators/public.decorator';
import { Roles } from '../../auth/api/decorators/roles.decorator';
import { AccessTokenPayload } from '../../auth/domain/types/access-token-payload';
import {
  CreateOrderDto,
  CreateOrderItemDto,
} from '../application/dto/create-order.application.dto';
import {
  DeliveryQuoteDto,
  GetDeliveryQuoteQuery,
} from '../application/queries/get-delivery-quote.query';
import { GetMyOrdersQuery } from '../application/queries/get-my-orders.query';
import { GetOrderByIdQuery } from '../application/queries/get-order-by-id.query';
import { CreateOrderCommand } from '../application/usecases/create-order.usecase';
import { ApiCreateOrder } from './docs/create-order.docs';
import { ApiGetDeliveryQuote } from './docs/get-delivery-quote.docs';
import { ApiGetMyOrders, ApiGetOrderById } from './docs/get-my-orders.docs';
import { CreateOrderInputDto } from './input-dto/create-order.input-dto';
import { DeliveryQuoteInputDto } from './input-dto/delivery-quote.input-dto';
import { DeliveryQuoteViewDto } from './view-dto/delivery-quote.view-dto';
import { OrderListItemViewDto } from './view-dto/order-list-item.view-dto';
import { OrderViewDto } from './view-dto/order.view-dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Public()
  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiGetDeliveryQuote()
  quote(@Body() body: DeliveryQuoteInputDto): Promise<DeliveryQuoteViewDto> {
    const dto: DeliveryQuoteDto = {
      restaurantId: body.restaurantId,
      branchId: body.branchId ?? null,
      orderType: body.orderType,
      items: toApplicationItems(body.items),
      delivery: body.delivery
        ? {
            address: body.delivery.address,
            details: body.delivery.details ?? null,
            latitude: body.delivery.latitude,
            longitude: body.delivery.longitude,
          }
        : null,
    };

    return this.queryBus.execute(new GetDeliveryQuoteQuery(dto));
  }

  @Roles(Role.CLIENT)
  @Post()
  @ApiCreateOrder()
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateOrderInputDto,
  ): Promise<OrderViewDto> {
    const dto: CreateOrderDto = {
      userId: user.sub,
      restaurantId: body.restaurantId,
      branchId: body.branchId ?? null,
      orderType: body.orderType,
      paymentMethod: body.paymentMethod,
      items: toApplicationItems(body.items),
      delivery: body.delivery
        ? {
            address: body.delivery.address,
            details: body.delivery.details ?? null,
            latitude: body.delivery.latitude,
            longitude: body.delivery.longitude,
          }
        : null,
      contactPhone: body.contactPhone ?? null,
      comment: body.comment ?? null,
    };

    return this.commandBus.execute(new CreateOrderCommand(dto));
  }

  @Roles(Role.CLIENT)
  @Get('mine')
  @ApiGetMyOrders()
  mine(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<OrderListItemViewDto[]> {
    return this.queryBus.execute(new GetMyOrdersQuery(user.sub));
  }

  @Roles(Role.CLIENT)
  @Get(':id')
  @ApiGetOrderById()
  byId(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderViewDto> {
    return this.queryBus.execute(new GetOrderByIdQuery(user.sub, id));
  }
}

function toApplicationItems(
  items: CreateOrderInputDto['items'],
): CreateOrderItemDto[] {
  return items.map((item) => ({
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    optionIds: item.optionIds ?? [],
  }));
}
