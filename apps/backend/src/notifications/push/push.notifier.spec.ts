import { OrderStatus, PUSH_DATA_TYPES } from '@foodhubme/shared';
import { JobsOptions, Queue } from 'bullmq';
import { JOBS } from '../../queues/queue-names';
import { PushMessage } from './push-channel.interface';
import { PushNotifier, SendPushJob } from './push.notifier';
import { PushPolicy } from './push.policy';

const message: PushMessage = {
  title: 'Заказ №1043 принят',
  body: 'Готовим — будет готов примерно через 25 минут',
  data: {
    type: PUSH_DATA_TYPES.ORDER_STATUS,
    orderId: 'order-1',
    status: OrderStatus.ACCEPTED,
  },
};

const makeNotifier = () => {
  const add = jest
    .fn<Promise<unknown>, [string, SendPushJob, JobsOptions]>()
    .mockResolvedValue({});
  const notifier = new PushNotifier({
    add,
  } as unknown as Queue<SendPushJob>);

  return { notifier, add };
};

describe('PushNotifier', () => {
  it('кладёт задачу в очередь, а не отправляет сам', async () => {
    const { notifier, add } = makeNotifier();

    await notifier.notify('user-1', message);

    expect(add).toHaveBeenCalledWith(
      JOBS.SEND_PUSH,
      { userId: 'user-1', message },
      expect.anything(),
    );
  });

  it('в задаче нет токенов устройств — только КОМУ и ЧТО', async () => {
    const { notifier, add } = makeNotifier();

    await notifier.notify('user-1', message);

    expect(Object.keys(add.mock.calls[0][1])).toEqual(['userId', 'message']);
  });

  it('просит повторить при сбое — с растущей паузой', async () => {
    const { notifier, add } = makeNotifier();

    await notifier.notify('user-1', message);

    expect(add.mock.calls[0][2]).toEqual({
      attempts: PushPolicy.DELIVERY_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: PushPolicy.DELIVERY_BACKOFF_MS,
      },
    });
  });

  it('упавшая очередь НЕ роняет того, кто уведомляет', async () => {
    const { notifier, add } = makeNotifier();
    add.mockRejectedValue(new Error('Redis недоступен'));

    await expect(notifier.notify('user-1', message)).resolves.toBeUndefined();
  });
});
