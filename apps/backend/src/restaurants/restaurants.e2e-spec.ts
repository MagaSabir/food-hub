import { AppModule } from '../app.module';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { applyAppInitialization } from '../setup/apply-app-initialization';
import request from 'supertest';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantListItem } from '@foodhubme/shared';
import { App } from 'supertest/types';

describe('GET /api/restaurants (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async (): Promise<void> => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    applyAppInitialization(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async (): Promise<void> => {
    await prisma.restaurant.createMany({
      data: [
        { name: 'Active', slug: 'active', cuisineTypes: ['Pizza'] },
        {
          name: 'Hidden',
          slug: 'hidden',
          cuisineTypes: ['Sushi'],
          isActive: false,
        },
      ],
    });
  });

  afterEach(async () => {
    await prisma.restaurant.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200', async (): Promise<void> => {
    await request(app.getHttpServer()).get('/api/restaurants').expect(200);
  });

  it('should return only active restaurants', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/restaurants')
      .expect(200);

    const body = res.body as RestaurantListItem[];
    expect(res.body).toHaveLength(1);
    expect(body[0].name).toBe('Active');
  });

  it('should not expose internal fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/restaurants')
      .expect(200);
    const body = res.body as RestaurantListItem[];

    expect(Object.keys(body[0])).not.toContain('commissionPercent');
    expect(Object.keys(body[0])).not.toContain('isActive');
  });
});
