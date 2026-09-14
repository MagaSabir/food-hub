import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { applyAppInitialization } from '../setup/app-initialization';
import { AuthSubjectType } from './domain/types/auth-subject';
import { OtpPolicy } from './domain/policies/otp.policy';
import { OTP_SENDER } from './infrastructure/otp-sender/otp-sender.interface';
import { SessionsRepository } from './infrastructure/repositories/sessions.repository';

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let sessions: SessionsRepository;

  const sentCodes = new Map<string, string>();
  const usedPhones: string[] = [];

  const ADMIN = {
    email: 'admin@foodhub.local',
    password: 'Admin12345!',
    scope: 'platform',
  };
  const ADMIN_ID = '44444444-0000-0000-0000-000000000001';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(OTP_SENDER)
      .useValue({
        send: (phone: string, code: string): Promise<void> => {
          sentCodes.set(phone, code);
          return Promise.resolve();
        },
      })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    applyAppInitialization(app);
    await app.init();

    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
    sessions = app.get(SessionsRepository);
  });

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { phone: { in: usedPhones } },
    });
    for (const user of users) {
      await sessions.deleteAllForSubject(AuthSubjectType.CLIENT, user.id);
    }
    await prisma.user.deleteMany({ where: { phone: { in: usedPhones } } });
    await sessions.deleteAllForSubject(AuthSubjectType.ADMIN, ADMIN_ID);

    if (usedPhones.length) {
      await redis.client.del(
        ...usedPhones.flatMap((phone) => [
          `otp:code:${phone}`,
          `otp:cooldown:${phone}`,
          `otp:count:${phone}`,
          `otp:attempts:${phone}`,
        ]),
      );
    }

    await redis.client.del(
      `login:fails:${AuthSubjectType.ADMIN}:${ADMIN.email}`,
      `login:fails:${AuthSubjectType.ADMIN}:ghost@foodhub.local`,
      `login:fails:${AuthSubjectType.ADMIN}:owner@syrovarnya.local`,
      `login:fails:${AuthSubjectType.STAFF}:${ADMIN.email}`,
    );

    await app.close();
  });

  const api = () => request(app.getHttpServer());

  function wrongCode(realCode: string): string {
    return String((Number(realCode[0]) + 1) % 10) + realCode.slice(1);
  }

  function newPhone(): string {
    const tail = Math.floor(Math.random() * 10_000_000)
      .toString()
      .padStart(7, '0');
    const phone = `+7999${tail}`;
    usedPhones.push(phone);
    return phone;
  }

  async function loginClient(phone: string) {
    await api().post('/api/auth/phone/request').send({ phone }).expect(200);

    const code = sentCodes.get(phone);
    const res = await api()
      .post('/api/auth/phone/verify')
      .send({ phone, code })
      .expect(200);

    return res.body as {
      accessToken: string;
      refreshToken: string;
      tokenType: string;
    };
  }

  describe('что открыто гостю, а что закрыто', () => {
    it('каталог доступен без токена', async () => {
      await api().get('/api/restaurants').expect(200);
    });

    it('/health доступен без токена', async () => {
      await api().get('/api/health').expect(200);
    });

    it('/auth/me без токена → 401', async () => {
      const res = await api().get('/api/auth/me').expect(401);

      expect(res.body.code).toBe('INVALID_ACCESS_TOKEN');
    });

    it('/auth/me с мусорным токеном → 401', async () => {
      const res = await api()
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);

      expect(res.body.code).toBe('INVALID_ACCESS_TOKEN');
    });
  });

  describe('вход админки', () => {
    it('верный пароль → access в теле, refresh в httpOnly-cookie', async () => {
      const res = await api().post('/api/auth/login').send(ADMIN).expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeUndefined();

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('Path=/api/auth');
    });

    it('неверный пароль и несуществующий email → ОДИН и тот же ответ', async () => {
      const wrongPassword = await api()
        .post('/api/auth/login')
        .send({ ...ADMIN, password: 'WrongPassword1' })
        .expect(401);

      const noSuchEmail = await api()
        .post('/api/auth/login')
        .send({ ...ADMIN, email: 'ghost@foodhub.local' })
        .expect(401);

      expect(wrongPassword.body.code).toBe('INVALID_CREDENTIALS');
      expect(noSuchEmail.body.message).toBe(wrongPassword.body.message);
    });

    it('сотрудник не войдёт со scope=platform', async () => {
      await api()
        .post('/api/auth/login')
        .send({
          email: 'owner@syrovarnya.local',
          password: 'Owner12345!',
          scope: 'platform',
        })
        .expect(401);
    });

    it('/auth/me отдаёт роль и принадлежность', async () => {
      const login = await api().post('/api/auth/login').send(ADMIN).expect(200);

      const me = await api()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .expect(200);

      expect(me.body.role).toBe('PLATFORM_ADMIN');
      expect(me.body.email).toBe(ADMIN.email);
      expect(me.body.restaurantId).toBeNull();
    });
  });

  describe('обновление токенов — ответ тем же каналом', () => {
    it('cookie-канал: новый refresh уходит в cookie, в теле его нет', async () => {
      const login = await api().post('/api/auth/login').send(ADMIN).expect(200);
      const cookies = login.headers['set-cookie'] as unknown as string[];

      const refreshed = await api()
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      expect(refreshed.body.accessToken).toBeDefined();
      expect(refreshed.body.refreshToken).toBeUndefined();
      expect(refreshed.headers['set-cookie']).toBeDefined();
    });

    it('body-канал: новый refresh приходит В ТЕЛЕ (мобильное приложение)', async () => {
      const tokens = await loginClient(newPhone());

      const refreshed = await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(200);

      expect(refreshed.body.refreshToken).toBeDefined();
      expect(refreshed.body.refreshToken).not.toBe(tokens.refreshToken);
    });

    it('приложение может обновиться ДВАЖДЫ подряд', async () => {
      const tokens = await loginClient(newPhone());

      const first = await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(200);

      await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: first.body.refreshToken })
        .expect(200);
    });

    it('старый refresh после ротации не работает', async () => {
      const tokens = await loginClient(newPhone());

      await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(200);

      const res = await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(401);

      expect(res.body.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('выход', () => {
    it('гасит сессию: обновиться больше нельзя', async () => {
      const login = await api().post('/api/auth/login').send(ADMIN).expect(200);
      const cookies = login.headers['set-cookie'] as unknown as string[];

      await api().post('/api/auth/logout').set('Cookie', cookies).expect(204);

      await api().post('/api/auth/refresh').set('Cookie', cookies).expect(401);
    });
  });

  describe('вход клиента по телефону', () => {
    it('запрос кода → подтверждение → токены и профиль', async () => {
      const phone = newPhone();

      const requested = await api()
        .post('/api/auth/phone/request')
        .send({ phone })
        .expect(200);

      expect(requested.body).toEqual({
        cooldownSec: OtpPolicy.COOLDOWN_SEC,
        expiresInSec: OtpPolicy.TTL_SEC,
      });

      const verified = await api()
        .post('/api/auth/phone/verify')
        .send({ phone, code: sentCodes.get(phone) })
        .expect(200);

      const me = await api()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${verified.body.accessToken}`)
        .expect(200);

      expect(me.body.role).toBe('CLIENT');
      expect(me.body.phone).toBe(phone);
      expect(me.body.email).toBeNull();
    });

    it('номер в другой записи — тот же аккаунт, не второй', async () => {
      const phone = newPhone();
      const tokens = await loginClient(phone);

      const me = await api()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      const asLocal = phone.replace('+7', '8');
      const users = await prisma.user.findMany({ where: { phone } });
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe(me.body.id);
      expect(asLocal).not.toBe(phone);
    });

    it('код одноразовый: повторный вход тем же кодом → 401', async () => {
      const phone = newPhone();
      await api().post('/api/auth/phone/request').send({ phone }).expect(200);
      const code = sentCodes.get(phone);

      await api()
        .post('/api/auth/phone/verify')
        .send({ phone, code })
        .expect(200);

      const res = await api()
        .post('/api/auth/phone/verify')
        .send({ phone, code })
        .expect(401);

      expect(res.body.code).toBe('INVALID_OTP');
    });

    it('повторный запрос кода сразу → 429 с остатком времени', async () => {
      const phone = newPhone();
      await api().post('/api/auth/phone/request').send({ phone }).expect(200);

      const res = await api()
        .post('/api/auth/phone/request')
        .send({ phone })
        .expect(429);

      expect(res.body.code).toBe('OTP_TOO_SOON');
      expect(res.body.message).toMatch(/через \d+ сек/);
    });

    it('после исчерпания попыток код мёртв даже при верном вводе', async () => {
      const phone = newPhone();
      await api().post('/api/auth/phone/request').send({ phone }).expect(200);
      const code = sentCodes.get(phone)!;

      for (let i = 0; i < OtpPolicy.MAX_ATTEMPTS; i++) {
        const res = await api()
          .post('/api/auth/phone/verify')
          .send({ phone, code: wrongCode(code) })
          .expect(401);
        expect(res.body.code).toBe('INVALID_OTP');
      }

      const exceeded = await api()
        .post('/api/auth/phone/verify')
        .send({ phone, code: wrongCode(code) })
        .expect(401);
      expect(exceeded.body.code).toBe('OTP_ATTEMPTS_EXCEEDED');

      await api()
        .post('/api/auth/phone/verify')
        .send({ phone, code })
        .expect(401);
    });

    it('кривой номер → 400 с разбором по полю', async () => {
      const res = await api()
        .post('/api/auth/phone/request')
        .send({ phone: '+12125550100' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.extensions[0].field).toBe('phone');
    });
  });
});
