import { OrderStatus, PUSH_DATA_TYPES } from '@foodhubme/shared';
import { Job } from 'bullmq';
import { DevicesService } from '../devices.service';
import {
  DEVICE_NOT_REGISTERED,
  PushDelivery,
  PushMessage,
} from './push-channel.interface';
import { SendPushJob } from './push.notifier';
import { PushProcessor } from './push.processor';

const message: PushMessage = {
  title: 'Заказ №1043 готов',
  body: 'Можно забирать',
  data: {
    type: PUSH_DATA_TYPES.ORDER_STATUS,
    orderId: 'order-1',
    status: OrderStatus.READY,
  },
};

const job = { data: { userId: 'user-1', message } } as Job<SendPushJob>;

const makeProcessor = (over: { tokens?: string[] } = {}) => {
  const send = jest.fn<Promise<PushDelivery[]>, [string[], PushMessage]>();
  const tokensOf = jest.fn().mockResolvedValue(over.tokens ?? []);
  const forget = jest.fn().mockResolvedValue(undefined);

  const processor = new PushProcessor({ send }, {
    tokensOf,
    forget,
  } as unknown as DevicesService);

  return { processor, send, tokensOf, forget };
};

describe('PushProcessor', () => {
  it('шлёт на все устройства человека одной пачкой', async () => {
    const { processor, send } = makeProcessor({ tokens: ['a', 'b'] });
    send.mockResolvedValue([
      { token: 'a', ok: true },
      { token: 'b', ok: true },
    ]);

    await processor.process(job);

    expect(send).toHaveBeenCalledWith(['a', 'b'], message);
  });

  it('нет устройств — молчим, и это не сбой', async () => {
    const { processor, send } = makeProcessor({ tokens: [] });

    await expect(processor.process(job)).resolves.toBeUndefined();

    expect(send).not.toHaveBeenCalled();
  });

  it('устройство пропало — забываем его', async () => {
    const { processor, send, forget } = makeProcessor({ tokens: ['a', 'b'] });
    send.mockResolvedValue([
      { token: 'a', ok: true },
      { token: 'b', ok: false, error: DEVICE_NOT_REGISTERED },
    ]);

    await processor.process(job);

    expect(forget).toHaveBeenCalledWith(['b']);
  });

  it('прочие отказы устройство не удаляют', async () => {
    const { processor, send, forget } = makeProcessor({ tokens: ['a'] });
    send.mockResolvedValue([
      { token: 'a', ok: false, error: 'MessageRateExceeded' },
    ]);

    await processor.process(job);

    expect(forget).not.toHaveBeenCalled();
  });

  it('отказ по устройству задачу НЕ роняет', async () => {
    const { processor, send } = makeProcessor({ tokens: ['a', 'b'] });
    send.mockResolvedValue([
      { token: 'a', ok: true },
      { token: 'b', ok: false, error: DEVICE_NOT_REGISTERED },
    ]);

    await expect(processor.process(job)).resolves.toBeUndefined();
  });

  it('провайдер недоступен — пробрасываем, чтобы BullMQ повторил', async () => {
    const { processor, send } = makeProcessor({ tokens: ['a'] });
    send.mockRejectedValue(new Error('ECONNRESET'));

    await expect(processor.process(job)).rejects.toThrow('ECONNRESET');
  });
});
