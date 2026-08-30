import { RestaurantListItemViewDto } from './restaurant-list-item.view-dto';
import { Prisma } from '@prisma/client';

const row = {
  id: '123',
  name: 'name',
  slug: 'slug',
  description: null,
  cuisineTypes: ['Italian', 'Pizza', 'Pasta'],
  logoUrl: null,
  ratingFood: new Prisma.Decimal('4.8'),
  ratingDelivery: new Prisma.Decimal('4.7'),
  reviewsCount: 512,
};

function makeRow(overrides = {}) {
  return { ...row, ...overrides };
}

describe('RestaurantListItemViewDto.mapToView', () => {
  it('should convert Decimal ratings to number', () => {
    const row = makeRow({
      ratingFood: new Prisma.Decimal('4.7'),
      ratingDelivery: new Prisma.Decimal('4.8'),
    });
    const dto = RestaurantListItemViewDto.mapToView(row);

    expect(dto.ratingFood).toBe(4.7);
    expect(dto.ratingDelivery).toBe(4.8);
  });

  it('should keep null description and logo', () => {
    const row = makeRow();
    const dto = RestaurantListItemViewDto.mapToView(row);
    expect(dto.description).toBeNull();
    expect(dto.logoUrl).toBeNull();
  });
  it('should pass cuisine types through unchanged', () => {
    const row = makeRow({ cuisineTypes: ['Italian', 'Pizza', 'Burger'] });
    const dto = RestaurantListItemViewDto.mapToView(row);
    expect(dto.cuisineTypes).toEqual(['Italian', 'Pizza', 'Burger']);
  });
});
