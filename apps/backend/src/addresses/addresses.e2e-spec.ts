import { ErrorCodes, MAX_SAVED_ADDRESSES } from '@foodhubme/shared';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../app.module';
import { AuthTokenService } from '../auth/application/services/auth-token.service';
import { PrismaService } from '../prisma/prisma.service';
import { applyAppInitialization } from '../setup/app-initialization';

describe('Адресная книга (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const SUFFIX = Math.random().toString(36).slice(2, 8);
  const ids = { alice: '', bob: '' };
  const tokens = { alice: '', bob: '', staff: '' };

  const api = () => request(app.getHttpServer());
  const asAlice = (req: request.Test) =>
    req.set('Authorization', `Bearer ${tokens.alice}`);
  const asBob = (req: request.Test) =>
    req.set('Authorization', `Bearer ${tokens.bob}`);

  const address = (n: number) => ({
    address: `Грозный, пр. Тестовый, ${n}`,
    details: `подъезд ${n}`,
    latitude: 43.3169 + n / 1000,
    longitude: 45.6981,
  });

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
      data: { phone: `+7902${SUFFIX}1` },
    });
    const bob = await prisma.client.user.create({
      data: { phone: `+7902${SUFFIX}2` },
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
      sub: 'aaaaaaaa-0000-4000-8000-000000000003',
      role: Role.RESTAURANT_OWNER,
      restaurantId: 'bbbbbbbb-0000-4000-8000-000000000003',
      branchId: null,
    });
  });

  afterAll(async () => {
    const userIds = [ids.alice, ids.bob].filter(Boolean);
    await prisma.client.userAddress.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.client.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  describe('доступ', () => {
    it('гость без токена → 401 на всех четырёх', async () => {
      await api().get('/api/addresses').expect(401);
      await api().post('/api/addresses').send(address(1)).expect(401);
      await api()
        .put('/api/addresses/00000000-0000-4000-8000-000000000000/default')
        .expect(401);
      await api()
        .delete('/api/addresses/00000000-0000-4000-8000-000000000000')
        .expect(401);
    });

    it('сотрудник ресторана → 403: адреса есть только у клиента', async () => {
      const res = await api()
        .get('/api/addresses')
        .set('Authorization', `Bearer ${tokens.staff}`)
        .expect(403);

      expect(res.body.code).toBe(ErrorCodes.ACCESS_DENIED);
    });
  });

  describe('сохранение', () => {
    it('первый адрес сохраняется и сразу становится основным', async () => {
      const res = await asAlice(api().post('/api/addresses'))
        .send(address(1))
        .expect(201);

      expect(res.body).toMatchObject({
        address: 'Грозный, пр. Тестовый, 1',
        details: 'подъезд 1',
        isDefault: true,
      });
    });

    it('следующий забирает признак основного себе', async () => {
      const res = await asAlice(api().post('/api/addresses'))
        .send(address(2))
        .expect(201);
      expect(res.body.isDefault).toBe(true);

      const list = await asAlice(api().get('/api/addresses')).expect(200);
      const defaults = list.body.filter(
        (a: { isDefault: boolean }) => a.isDefault,
      );
      expect(defaults).toHaveLength(1);
      expect(list.body[0].address).toBe('Грозный, пр. Тестовый, 2');
    });

    it('населённый пункт возвращается отдельным полем', async () => {
      const res = await asBob(api().post('/api/addresses'))
        .send({
          address: 'ул. Ленина, 5',
          locality: 'Гикало',
          latitude: 43.2,
          longitude: 45.6,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        address: 'ул. Ленина, 5',
        locality: 'Гикало',
      });

      const list = await asBob(api().get('/api/addresses')).expect(200);
      expect(list.body[0].locality).toBe('Гикало');

      await asBob(api().delete(`/api/addresses/${res.body.id}`)).expect(204);
    });

    it('без населённого пункта → null, приложение подставит город пилота', async () => {
      const res = await asBob(api().post('/api/addresses'))
        .send({
          address: 'пр. Тестовый, 7',
          latitude: 43.3169,
          longitude: 45.6981,
        })
        .expect(201);

      expect(res.body.locality).toBeNull();

      await asBob(api().delete(`/api/addresses/${res.body.id}`)).expect(204);
    });

    it('адрес без координат → 400', async () => {
      await asAlice(api().post('/api/addresses'))
        .send({ address: 'Грозный, пр. Тестовый, 9' })
        .expect(400);
    });

    it('сверх лимита → 409 ADDRESS_LIMIT_REACHED', async () => {
      await asAlice(api().post('/api/addresses')).send(address(3)).expect(201);

      const res = await asAlice(api().post('/api/addresses'))
        .send(address(4))
        .expect(409);

      expect(res.body.code).toBe(ErrorCodes.ADDRESS_LIMIT_REACHED);

      const list = await asAlice(api().get('/api/addresses')).expect(200);
      expect(list.body).toHaveLength(MAX_SAVED_ADDRESSES);
    });
  });

  describe('изоляция', () => {
    it('второй человек не видит чужую книгу', async () => {
      const res = await asBob(api().get('/api/addresses')).expect(200);

      expect(res.body).toEqual([]);
    });

    it('чужой адрес не сделать своим основным → 404', async () => {
      const mine = await asAlice(api().get('/api/addresses')).expect(200);
      const alienId = mine.body[0].id as string;

      const res = await asBob(
        api().put(`/api/addresses/${alienId}/default`),
      ).expect(404);

      expect(res.body.code).toBe(ErrorCodes.ADDRESS_NOT_FOUND);
    });

    it('чужой адрес не удаляется', async () => {
      const mine = await asAlice(api().get('/api/addresses')).expect(200);
      const alienId = mine.body[0].id as string;

      await asBob(api().delete(`/api/addresses/${alienId}`)).expect(404);

      const after = await asAlice(api().get('/api/addresses')).expect(200);
      expect(after.body.map((a: { id: string }) => a.id)).toContain(alienId);
    });
  });

  describe('удаление', () => {
    it('убрали основной → основным становится самый свежий из оставшихся', async () => {
      const before = await asAlice(api().get('/api/addresses')).expect(200);
      const currentDefault = before.body[0] as { id: string };

      await asAlice(api().delete(`/api/addresses/${currentDefault.id}`)).expect(
        204,
      );

      const after = await asAlice(api().get('/api/addresses')).expect(200);
      expect(after.body[0].isDefault).toBe(true);
      expect(after.body[0].id).not.toBe(currentDefault.id);
    });

    it('несуществующий адрес → 404', async () => {
      await asAlice(
        api().delete('/api/addresses/00000000-0000-4000-8000-000000000000'),
      ).expect(404);
    });
  });
});
