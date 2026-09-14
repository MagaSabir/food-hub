import { ErrorCodes } from '@foodhubme/shared';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../app.module';
import { AuthTokenService } from '../auth/application/services/auth-token.service';
import { PrismaService } from '../prisma/prisma.service';
import { applyAppInitialization } from '../setup/app-initialization';

describe('Устройства для push (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const SUFFIX = Math.random().toString(36).slice(2, 8);
  const TOKEN = `ExponentPushToken[e2e-${SUFFIX}]`;

  const ids = { alice: '', bob: '' };
  const tokens = { alice: '', bob: '', staff: '' };

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    applyAppInitialization(app);
    await app.init();

    prisma = app.get(PrismaService);
    const authTokens = app.get(AuthTokenService);

    const alice = await prisma.client.user.create({
      data: { phone: `+7901${SUFFIX}1` },
    });
    const bob = await prisma.client.user.create({
      data: { phone: `+7901${SUFFIX}2` },
    });
    ids.alice = alice.id;
    ids.bob = bob.id;

    tokens.alice = await authTokens.signAccess({
      sub: alice.id,
      role: Role.CLIENT,
    });
    tokens.bob = await authTokens.signAccess({
      sub: bob.id,
      role: Role.CLIENT,
    });
    tokens.staff = await authTokens.signAccess({
      sub: 'aaaaaaaa-0000-4000-8000-000000000002',
      role: Role.RESTAURANT_OWNER,
      restaurantId: 'bbbbbbbb-0000-4000-8000-000000000002',
      branchId: null,
    });
  });

  afterAll(async () => {
    const userIds = [ids.alice, ids.bob].filter(Boolean);
    await prisma.client.userDevice.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.client.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  const asAlice = (req: request.Test) =>
    req.set('Authorization', `Bearer ${tokens.alice}`);

  describe('доступ', () => {
    it('гость без токена → 401', async () => {
      await api()
        .post('/api/devices')
        .send({ expoPushToken: TOKEN })
        .expect(401);
    });

    it('сотрудник ресторана → 403 ACCESS_DENIED', async () => {
      const res = await api()
        .post('/api/devices')
        .set('Authorization', `Bearer ${tokens.staff}`)
        .send({ expoPushToken: TOKEN })
        .expect(403);

      expect(res.body.code).toBe(ErrorCodes.ACCESS_DENIED);
    });
  });

  describe('проверка тела', () => {
    it('мусор вместо токена → 400', async () => {
      await asAlice(api().post('/api/devices'))
        .send({ expoPushToken: 'просто-строка' })
        .expect(400);
    });

    it('чужая платформа → 400', async () => {
      await asAlice(api().post('/api/devices'))
        .send({ expoPushToken: TOKEN, platform: 'windows' })
        .expect(400);
    });
  });

  describe('регистрация', () => {
    it('запоминает устройство за тем, чей токен в запросе', async () => {
      await asAlice(api().post('/api/devices'))
        .send({ expoPushToken: TOKEN, platform: 'ios' })
        .expect(204);

      const device = await prisma.client.userDevice.findUnique({
        where: { expoPushToken: TOKEN },
      });
      expect(device).toMatchObject({ userId: ids.alice, platform: 'ios' });
    });

    it('повторный вызов не ошибка и не создаёт дубль', async () => {
      await asAlice(api().post('/api/devices'))
        .send({ expoPushToken: TOKEN, platform: 'ios' })
        .expect(204);

      const count = await prisma.client.userDevice.count({
        where: { expoPushToken: TOKEN },
      });
      expect(count).toBe(1);
    });

    it('вошли с другого аккаунта — устройство переезжает', async () => {
      await api()
        .post('/api/devices')
        .set('Authorization', `Bearer ${tokens.bob}`)
        .send({ expoPushToken: TOKEN, platform: 'ios' })
        .expect(204);

      const devices = await prisma.client.userDevice.findMany({
        where: { expoPushToken: TOKEN },
      });
      expect(devices).toHaveLength(1);
      expect(devices[0].userId).toBe(ids.bob);
    });

    it('у человека может быть несколько устройств', async () => {
      const tablet = `ExponentPushToken[e2e-${SUFFIX}-tablet]`;

      await asAlice(api().post('/api/devices'))
        .send({ expoPushToken: tablet, platform: 'android' })
        .expect(204);

      const count = await prisma.client.userDevice.count({
        where: { userId: ids.alice },
      });
      expect(count).toBe(1);

      await prisma.client.userDevice.deleteMany({
        where: { expoPushToken: tablet },
      });
    });
  });
});
