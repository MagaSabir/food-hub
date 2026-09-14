import { MockSmsChannel } from './mock-sms.channel';
import { MockTelegramChannel } from './mock-telegram.channel';

const PHONE = '+79280000001';

describe('заглушки каналов (Шаг 6.3)', () => {
  const withNodeEnv = (value: string, fn: () => void) => {
    const before = process.env.NODE_ENV;
    process.env.NODE_ENV = value;
    try {
      fn();
    } finally {
      process.env.NODE_ENV = before;
    }
  };

  describe('MockTelegramChannel', () => {
    it('всегда отвечает «не доставил» — иначе фолбэк никогда не выполняется', async () => {
      await expect(new MockTelegramChannel().send(PHONE)).resolves.toBe(false);
    });

    it('в production не поднимается', () => {
      withNodeEnv('production', () => {
        expect(() => new MockTelegramChannel().onModuleInit()).toThrow(
          /production/,
        );
      });
    });
  });

  describe('MockSmsChannel', () => {
    it('«доставляет» — на разработке это и есть способ войти', async () => {
      await expect(new MockSmsChannel().send(PHONE, '12345')).resolves.toBe(
        true,
      );
    });

    it('в production не поднимается', () => {
      withNodeEnv('production', () => {
        expect(() => new MockSmsChannel().onModuleInit()).toThrow(/production/);
      });
    });
  });
});
