import { RestaurantsQueryRepository } from './restaurants.query-repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('RestaurantsQueryRepository.findCatalog', () => {
  it('should filter out inactive and hidden restaurants', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { restaurant: { findMany } } as unknown as PrismaService;
    const repo = new RestaurantsQueryRepository(prisma);

    await repo.findCatalog();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, showInCatalog: true },
      }),
    );
  });

  it('should return view dto with numeric ratings', async () => {
    const row = {
      id: '123',
      name: 'Vasabi',
      slug: 'vasabi',
      description: null,
      logoUrl: null,
      cuisineTypes: ['Italian', 'Pizza', 'Burger'],
      ratingFood: new Prisma.Decimal('4.5'),
      ratingDelivery: new Prisma.Decimal('4.7'),
      reviewsCount: 512,
    };
    const findMany = jest.fn().mockResolvedValue([row]);
    const prisma = { restaurant: { findMany } } as unknown as PrismaService;
    const repo = new RestaurantsQueryRepository(prisma);
    const result = await repo.findCatalog();

    expect(result).toHaveLength(1);
    expect(result[0].ratingFood).toBe(4.5);
    expect(result[0].name).toBe('Vasabi');
  });
});
