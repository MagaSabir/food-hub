import { CompositeOtpSender } from './composite-otp-sender';
import { IOtpChannel, OtpChannelName } from './otp-sender.interface';

const PHONE = '+79280000001';
const CODE = '12345';

const channel = (
  name: OtpChannelName,
  behaviour: 'delivers' | 'declines' | 'breaks',
): IOtpChannel & { send: jest.Mock } => ({
  name,
  send: jest.fn().mockImplementation(() => {
    if (behaviour === 'breaks')
      return Promise.reject(new Error('провайдер лёг'));
    return Promise.resolve(behaviour === 'delivers');
  }),
});

describe('CompositeOtpSender', () => {
  describe('auto — сначала дешёвый канал', () => {
    it('телеграм доставил → СМС не отправляем', async () => {
      const telegram = channel('telegram', 'delivers');
      const sms = channel('sms', 'delivers');

      await new CompositeOtpSender([telegram, sms]).send(PHONE, CODE, 'auto');

      expect(telegram.send).toHaveBeenCalledWith(PHONE, CODE);
      expect(sms.send).not.toHaveBeenCalled();
    });

    it('у номера нет телеграма → уходит СМС', async () => {
      const telegram = channel('telegram', 'declines');
      const sms = channel('sms', 'delivers');

      await new CompositeOtpSender([telegram, sms]).send(PHONE, CODE, 'auto');

      expect(sms.send).toHaveBeenCalledWith(PHONE, CODE);
    });

    it('канал СЛОМАЛСЯ → пробуем следующий, а не сдаёмся', async () => {
      const telegram = channel('telegram', 'breaks');
      const sms = channel('sms', 'delivers');

      await expect(
        new CompositeOtpSender([telegram, sms]).send(PHONE, CODE, 'auto'),
      ).resolves.toBeUndefined();

      expect(sms.send).toHaveBeenCalled();
    });

    it('порядок берётся из списка, а не выдумывается', async () => {
      const sms = channel('sms', 'delivers');
      const telegram = channel('telegram', 'delivers');

      await new CompositeOtpSender([sms, telegram]).send(PHONE, CODE, 'auto');

      expect(sms.send).toHaveBeenCalled();
      expect(telegram.send).not.toHaveBeenCalled();
    });
  });

  describe('sms — человек нажал «не пришёл код»', () => {
    it('идёт сразу в СМС, минуя телеграм', async () => {
      const telegram = channel('telegram', 'delivers');
      const sms = channel('sms', 'delivers');

      await new CompositeOtpSender([telegram, sms]).send(PHONE, CODE, 'sms');

      expect(telegram.send).not.toHaveBeenCalled();
      expect(sms.send).toHaveBeenCalledWith(PHONE, CODE);
    });
  });

  describe('не ушло ничем', () => {
    it('бросает — иначе очередь не повторит', async () => {
      const telegram = channel('telegram', 'declines');
      const sms = channel('sms', 'breaks');

      await expect(
        new CompositeOtpSender([telegram, sms]).send(PHONE, CODE, 'auto'),
      ).rejects.toThrow(/не ушёл ни одним каналом/);
    });

    it('просили СМС, а СМС-канала нет → тоже ошибка, а не тишина', async () => {
      const telegram = channel('telegram', 'delivers');

      await expect(
        new CompositeOtpSender([telegram]).send(PHONE, CODE, 'sms'),
      ).rejects.toThrow(/не ушёл ни одним каналом/);
    });
  });
});
