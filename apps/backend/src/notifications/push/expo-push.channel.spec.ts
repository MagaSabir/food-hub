import { OrderStatus, PUSH_DATA_TYPES } from '@foodhubme/shared';
import { ExpoPushChannel } from './expo-push.channel';
import { DEVICE_NOT_REGISTERED, PushMessage } from './push-channel.interface';
import { PushPolicy } from './push.policy';

const LIVE = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';
const DEAD = 'ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]';

const message: PushMessage = {
  title: 'Заказ №1043 в пути',
  body: 'Курьер выехал к вам',
  data: {
    type: PUSH_DATA_TYPES.ORDER_STATUS,
    orderId: 'order-1',
    status: OrderStatus.ON_THE_WAY,
  },
};

const ok = { status: 'ok', id: 'receipt-1' };
const notRegistered = {
  status: 'error',
  message: 'not registered',
  details: { error: DEVICE_NOT_REGISTERED },
};

const mockExpo = (
  tickets: unknown[],
  init: { ok?: boolean; status?: number } = {},
) =>
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: () => Promise.resolve({ data: tickets }),
    text: () => Promise.resolve('ошибка провайдера'),
  } as Response);

const sentMessages = (call: number = 0) =>
  JSON.parse(
    (jest.mocked(globalThis.fetch).mock.calls[call][1] as RequestInit)
      .body as string,
  ) as Record<string, unknown>[];

afterEach(() => jest.restoreAllMocks());

describe('ExpoPushChannel', () => {
  it('собирает сообщение: текст, данные, срок жизни и приоритет', async () => {
    mockExpo([ok]);

    await new ExpoPushChannel(undefined).send([LIVE], message);

    expect(sentMessages()).toEqual([
      {
        to: LIVE,
        title: message.title,
        body: message.body,
        data: message.data,
        sound: 'default',
        ttl: PushPolicy.TTL_SECONDS,
        priority: 'high',
      },
    ]);
  });

  it('без токена доступа заголовок авторизации не шлём', async () => {
    mockExpo([ok]);

    await new ExpoPushChannel(undefined).send([LIVE], message);

    const { headers } = jest.mocked(globalThis.fetch).mock
      .calls[0][1] as RequestInit;
    expect(headers).not.toHaveProperty('Authorization');
  });

  it('с токеном доступа — представляемся', async () => {
    mockExpo([ok]);

    await new ExpoPushChannel('secret').send([LIVE], message);

    const { headers } = jest.mocked(globalThis.fetch).mock
      .calls[0][1] as RequestInit;
    expect(headers).toMatchObject({ Authorization: 'Bearer secret' });
  });

  it('сопоставляет билеты с токенами по порядку', async () => {
    mockExpo([ok, notRegistered]);

    const results = await new ExpoPushChannel(undefined).send(
      [LIVE, DEAD],
      message,
    );

    expect(results).toEqual([
      { token: LIVE, ok: true },
      { token: DEAD, ok: false, error: DEVICE_NOT_REGISTERED },
    ]);
  });

  it('мусорный токен отбраковывает ДО отправки', async () => {
    mockExpo([ok]);

    const results = await new ExpoPushChannel(undefined).send(
      [LIVE, 'просто-строка'],
      message,
    );

    expect(sentMessages()).toHaveLength(1);
    expect(results).toContainEqual({
      token: 'просто-строка',
      ok: false,
      error: DEVICE_NOT_REGISTERED,
    });
  });

  it('все токены мусорные — до сети не идём вовсе', async () => {
    const fetchMock = mockExpo([]);

    const results = await new ExpoPushChannel(undefined).send(
      ['мусор'],
      message,
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(results).toEqual([
      { token: 'мусор', ok: false, error: DEVICE_NOT_REGISTERED },
    ]);
  });

  it('молчание провайдера по токену успехом не считаем', async () => {
    mockExpo([ok]);

    const results = await new ExpoPushChannel(undefined).send(
      [LIVE, DEAD],
      message,
    );

    expect(results[1]).toEqual({ token: DEAD, ok: false, error: 'NoTicket' });
  });

  it('шлёт пачками по 100 — предел провайдера', async () => {
    const many = Array.from(
      { length: 150 },
      (_, i) => `ExponentPushToken[${String(i).padStart(22, '0')}]`,
    );
    mockExpo(Array.from({ length: 100 }, () => ok));

    await new ExpoPushChannel(undefined).send(many, message);

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(sentMessages(0)).toHaveLength(100);
    expect(sentMessages(1)).toHaveLength(50);
  });

  it('отказ провайдера пробрасывает — доставки не было', async () => {
    mockExpo([], { ok: false, status: 502 });

    await expect(
      new ExpoPushChannel(undefined).send([LIVE], message),
    ).rejects.toThrow('502');
  });

  it('сетевую ошибку пробрасывает тоже', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNRESET'));

    await expect(
      new ExpoPushChannel(undefined).send([LIVE], message),
    ).rejects.toThrow('ECONNRESET');
  });
});
