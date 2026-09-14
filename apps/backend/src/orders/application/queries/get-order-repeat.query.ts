import type { RepeatOrderView } from '@foodhubme/shared';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { OrderNotFoundError } from '../../domain/errors/orders.errors';
import { RepeatOrderQueryRepository } from '../../infrastructure/repositories/repeat-order.query-repository';

export class GetOrderRepeatQuery extends Query<RepeatOrderView> {
  constructor(
    public readonly userId: string,
    public readonly orderId: string,
  ) {
    super();
  }
}

@QueryHandler(GetOrderRepeatQuery)
export class GetOrderRepeatQueryHandler implements IQueryHandler<
  GetOrderRepeatQuery,
  RepeatOrderView
> {
  constructor(private readonly repository: RepeatOrderQueryRepository) {}

  async execute({
    userId,
    orderId,
  }: GetOrderRepeatQuery): Promise<RepeatOrderView> {
    const plan = await this.repository.planFor(userId, orderId);

    if (plan === null) throw new OrderNotFoundError(orderId);

    return plan;
  }
}
