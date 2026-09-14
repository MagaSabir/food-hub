import { Queue } from 'bullmq';
import { JOBS } from '../../../queues/queue-names';
import { OtpPolicy } from '../../domain/policies/otp.policy';
import { QueuedOtpSender, SendOtpJob } from './queued-otp-sender';

describe('QueuedOtpSender', () => {
  const build = () => {
    const add = jest.fn().mockResolvedValue(undefined);
    const sender = new QueuedOtpSender({ add } as unknown as Queue<SendOtpJob>);

    return { sender, add };
  };

  it('кладёт задачу с номером, кодом и пожеланием канала', async () => {
    const { sender, add } = build();

    await sender.send('+79280000001', '12345', 'auto');

    expect(add).toHaveBeenCalledWith(
      JOBS.SEND_OTP,
      { phone: '+79280000001', code: '12345', preference: 'auto' },
      expect.anything(),
    );
  });

  it('нажатие «отправить по СМС» доезжает до воркера', async () => {
    const { sender, add } = build();

    await sender.send('+79280000001', '12345', 'sms');

    const [, job] = add.mock.calls[0] as [string, SendOtpJob];
    expect(job.preference).toBe('sms');
  });

  it('просит повторить при сбое — но так, чтобы уложиться в жизнь кода', async () => {
    const { sender, add } = build();

    await sender.send('+79280000001', '12345', 'auto');

    const [, , options] = add.mock.calls[0] as [
      string,
      SendOtpJob,
      { attempts: number; backoff: { type: string; delay: number } },
    ];

    expect(options.attempts).toBe(OtpPolicy.DELIVERY_ATTEMPTS);
    expect(options.backoff.type).toBe('exponential');

    const worstCaseSec =
      (options.backoff.delay / 1000) * (2 ** options.attempts - 1);
    expect(worstCaseSec).toBeLessThan(OtpPolicy.TTL_SEC);
  });

  it('не ждёт доставки: задача поставлена — и всё', async () => {
    const { sender, add } = build();

    await expect(
      sender.send('+79280000001', '12345', 'auto'),
    ).resolves.toBeUndefined();
    expect(add).toHaveBeenCalledTimes(1);
  });
});
