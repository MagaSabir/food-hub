import { ErrorCodes } from '@foodhubme/shared';
import { OrderViewDto } from '../../api/view-dto/order.view-dto';
import { OrdersQueryRepository } from '../../infrastructure/repositories/orders.query-repository';
import {
  GetOrderByIdQuery,
  GetOrderByIdQueryHandler,
} from './get-order-by-id.query';

describe('GetOrderByIdQueryHandler', () => {
  const repo = { findMineById: jest.fn() };
  const handler = new GetOrderByIdQueryHandler(
    repo as unknown as OrdersQueryRepository,
  );

  const ORDER_ID = '44444444-4444-4444-8444-444444444444';
  const USER_ID = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => repo.findMineById.mockReset());

  it('спрашивает репозиторий И id заказа, И владельца', async () => {
    repo.findMineById.mockResolvedValue(new OrderViewDto());

    await handler.execute(new GetOrderByIdQuery(USER_ID, ORDER_ID));

    expect(repo.findMineById).toHaveBeenCalledWith(USER_ID, ORDER_ID);
  });

  it('заказа нет ИЛИ он чужой → одна и та же ошибка ORDER_NOT_FOUND', async () => {
    repo.findMineById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetOrderByIdQuery(USER_ID, ORDER_ID)),
    ).rejects.toMatchObject({ code: ErrorCodes.ORDER_NOT_FOUND });
  });
});
