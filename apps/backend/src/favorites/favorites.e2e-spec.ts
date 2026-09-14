import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { ErrorCodes } from '@foodhubme/shared';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { applyAppInitialization } from '../setup/app-initialization';
import { AuthTokenService } from '../auth/application/services/auth-token.service';

describe('Избранное (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const SUFFIX = Math.random().toString(36).slice(2, 8);
  const CITY = `e2e-fav-city-${SUFFIX}`;
  const BRAND = `e2e-fav-${SUFFIX}`;
  const HIDDEN_BRAND = `e2e-fav-hidden-${SUFFIX}`;

  const HEX_TAIL = Math.floor(Math.random() * 0xffffffffffff)
    .toString(16)
    .padStart(12, '0');

  const ids = { city: '', brand: '', hiddenBrand: '', alice: '', bob: '' };
  const tokens = { alice: '', bob: '', staff: '' };

  const around = { from: '00:00', to: '23:59' };
  const alwaysOpen = {
    mon: [around],
    tue: [around],
    wed: [around],
    thu: [around],
    fri: [around],
    sat: [around],
    sun: [around],
  };

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

    const city = await prisma.client.city.create({
      data: { name: CITY, slug: CITY },
    });
    ids.city = city.id;

    const brand = await prisma.client.restaurant.create({
      data: {
        id: `22222222-1111-1111-1111-${HEX_TAIL}`,
        name: `E2E Избранное ${SUFFIX}`,
        slug: BRAND,
        cuisineTypes: [`e2e-${SUFFIX}`],
        branches: {
          create: {
            cityId: city.id,
            address: 'ул. Тестовая, 3',
            phone: '+7 928 000-00-00',
            workingHours: alwaysOpen,
          },
        },
      },
    });
    ids.brand = brand.id;

    const hidden = await prisma.client.restaurant.create({
      data: {
        name: `E2E Скрытый ${SUFFIX}`,
        slug: HIDDEN_BRAND,
        cuisineTypes: [`e2e-${SUFFIX}`],
        showInCatalog: false,
      },
    });
    ids.hiddenBrand = hidden.id;

    const alice = await prisma.client.user.create({
      data: { phone: `+7900${SUFFIX}1` },
    });
    const bob = await prisma.client.user.create({
      data: { phone: `+7900${SUFFIX}2` },
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
      sub: 'aaaaaaaa-0000-4000-8000-000000000001',
      role: Role.RESTAURANT_OWNER,
      restaurantId: brand.id,
      branchId: null,
    });
  });

  afterAll(async () => {
    const brandIds = [ids.brand, ids.hiddenBrand].filter(Boolean);
    const userIds = [ids.alice, ids.bob].filter(Boolean);
    await prisma.client.userFavorite.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.client.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.client.branch.deleteMany({
      where: { restaurantId: { in: brandIds } },
    });
    await prisma.client.restaurant.deleteMany({
      where: { id: { in: brandIds } },
    });
    if (ids.city)
      await prisma.client.city.deleteMany({ where: { id: ids.city } });
    await app.close();
  });

  const asAlice = (req: request.Test) =>
    req.set('Authorization', `Bearer ${tokens.alice}`);

  describe('доступ', () => {
    it('гость без токена → 401 на всех трёх', async () => {
      await api().get('/api/favorites').expect(401);
      await api()
        .post('/api/favorites')
        .send({ restaurantId: ids.brand })
        .expect(401);
      await api().delete(`/api/favorites/${ids.brand}`).expect(401);
    });

    it('сотрудник ресторана → 403 ACCESS_DENIED (избранное только у клиента)', async () => {
      const res = await api()
        .get('/api/favorites')
        .set('Authorization', `Bearer ${tokens.staff}`)
        .expect(403);

      expect(res.body.code).toBe(ErrorCodes.ACCESS_DENIED);
    });
  });

  describe('добавление и список', () => {
    it('в начале пусто', async () => {
      const res = await asAlice(api().get('/api/favorites')).expect(200);
      expect(res.body).toEqual([]);
    });

    it('добавляет и отдаёт карточку каталога с isOpen', async () => {
      await asAlice(api().post('/api/favorites'))
        .send({ restaurantId: ids.brand })
        .expect(204);

      const res = await asAlice(api().get('/api/favorites')).expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        id: ids.brand,
        slug: BRAND,
        isOpen: true,
      });
    });

    it('повторное добавление не ошибка и не создаёт дубль', async () => {
      await asAlice(api().post('/api/favorites'))
        .send({ restaurantId: ids.brand })
        .expect(204);

      const res = await asAlice(api().get('/api/favorites')).expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('несуществующий бренд → 404 RESTAURANT_NOT_FOUND', async () => {
      const res = await asAlice(api().post('/api/favorites'))
        .send({ restaurantId: '00000000-0000-4000-8000-000000000000' })
        .expect(404);

      expect(res.body.code).toBe(ErrorCodes.RESTAURANT_NOT_FOUND);
    });

    it('скрытый партнёром бренд в избранное не добавить', async () => {
      const res = await asAlice(api().post('/api/favorites'))
        .send({ restaurantId: ids.hiddenBrand })
        .expect(404);

      expect(res.body.code).toBe(ErrorCodes.RESTAURANT_NOT_FOUND);
    });

    it('мусор вместо uuid → 400 VALIDATION_ERROR', async () => {
      const res = await asAlice(api().post('/api/favorites'))
        .send({ restaurantId: 'любимый' })
        .expect(400);

      expect(res.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });
  });

  describe('изоляция', () => {
    it('второй пользователь не видит чужое избранное', async () => {
      const res = await api()
        .get('/api/favorites')
        .set('Authorization', `Bearer ${tokens.bob}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('чужое избранное не удаляется своим запросом', async () => {
      await api()
        .delete(`/api/favorites/${ids.brand}`)
        .set('Authorization', `Bearer ${tokens.bob}`)
        .expect(204);

      const alice = await asAlice(api().get('/api/favorites')).expect(200);
      expect(alice.body).toHaveLength(1);
    });
  });

  describe('удаление', () => {
    it('убирает из избранного', async () => {
      await asAlice(api().delete(`/api/favorites/${ids.brand}`)).expect(204);

      const res = await asAlice(api().get('/api/favorites')).expect(200);
      expect(res.body).toEqual([]);
    });

    it('повторное удаление — тоже 204', async () => {
      await asAlice(api().delete(`/api/favorites/${ids.brand}`)).expect(204);
    });
  });
});
