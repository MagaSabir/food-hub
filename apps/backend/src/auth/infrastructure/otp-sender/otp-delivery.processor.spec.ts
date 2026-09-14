import { Job } from 'bullmq';
import { OtpRepository } from '../repositories/otp.repository';
import { OtpDeliveryProcessor } from './otp-delivery.processor';
import { SendOtpJob } from './queued-otp-sender';

describe('OtpDeliveryProcessor', () => {
  const PHONE = '+79280000001';

  const build = (send = jest.fn().mockResolvedValue(undefined)) => {
    const releaseCooldown = jest.fn().mockResolvedValue(undefined);
    const processor = new OtpDeliveryProcessor({ send }, {
      releaseCooldown,
    } as unknown as OtpRepository);

    return { processor, send, releaseCooldown };
  };

  const job = (attemptsMade: number, attempts = 3): Job<SendOtpJob> =>
    ({
      data: { phone: PHONE, code: '12345', preference: 'auto' },
      opts: { attempts },
      attemptsMade,
    }) as Job<SendOtpJob>;

  it('отдаёт код настоящему каналу', async () => {
    const { processor, send } = build();

    await processor.process(job(0));

    expect(send).toHaveBeenCalledWith(PHONE, '12345', 'auto');
  });

  it('сбой канала ПРОБРАСЫВАЕТ наружу — иначе повтора не будет', async () => {
    const { processor } = build(jest.fn().mockRejectedValue(new Error('502')));

    await expect(processor.process(job(0))).rejects.toThrow('502');
  });

  it('попытки ещё остались — паузу между отправками не трогаем', async () => {
    const { processor, releaseCooldown } = build();

    await processor.onFailed(job(1), new Error('502'));

    expect(releaseCooldown).not.toHaveBeenCalled();
  });

  it('попытки исчерпаны — снимаем паузу, чтобы можно было запросить новый код', async () => {
    const { processor, releaseCooldown } = build();

    await processor.onFailed(job(3), new Error('502'));

    expect(releaseCooldown).toHaveBeenCalledWith(PHONE);
  });

  it('задачи нет (BullMQ умеет и так) — не падаем', async () => {
    const { processor, releaseCooldown } = build();

    await expect(
      processor.onFailed(undefined, new Error('нет задачи')),
    ).resolves.toBeUndefined();
    expect(releaseCooldown).not.toHaveBeenCalled();
  });
});
