import { RestaurantCardProps } from '@/entities/restaurant';

export const MOCK_LOCATION = {
  city: 'Грозный',
  address: 'Бульвар Дудаева, 30',
};
export const MOCK_HAS_UNREAD = true;

const DEMO_LOGO = require('@/assets/images/944341_ODUJEJ1.svg');

export const MOCK_RESTAURANTS: (RestaurantCardProps & { slug: string })[] = [
  {
    slug: 'bb-burgers',
    name: 'BB Burgers',
    cuisine: 'Бургеры • Американская',
    rating: 4.8,
    reviewsCount: 214,
    deliveryTime: '30–40 мин',
    deliveryFee: '149 ₽',
    freeDeliveryFrom: '500 ₽',
    isFastDelivery: true,
    imageUrl:
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
    logoUrl: DEMO_LOGO,
  },
  {
    slug: 'pizza-uno',
    name: 'Pizza Uno',
    cuisine: 'Пицца • Итальянская',
    rating: 4.7,
    reviewsCount: 98,
    deliveryTime: '25–35 мин',
    deliveryFee: '129 ₽',
    freeDeliveryFrom: '400 ₽',
    isFastDelivery: true,
    imageUrl:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    logoUrl: DEMO_LOGO,
  },
  {
    slug: 'tokyo-sushi',
    name: 'Tokyo Sushi',
    cuisine: 'Суши • Японская',
    rating: 4.9,
    reviewsCount: 5120,
    deliveryTime: '35–45 мин',
    deliveryFee: '149 ₽',
    freeDeliveryFrom: '700 ₽',
    imageUrl:
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
    logoUrl: DEMO_LOGO,
  },
  {
    slug: 'sakura',
    name: 'Sakura',
    cuisine: 'Суши • Японская',
    rating: 4.9,
    reviewsCount: 7,
    deliveryTime: '35–45 мин',
    deliveryFee: '300 ₽',
    imageUrl:
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
    logoUrl: DEMO_LOGO,
  },
  {
    slug: 'steak-house',
    name: 'Steak House',
    cuisine: 'Стейки • Гриль',
    rating: 4.6,
    reviewsCount: 0,
    deliveryTime: '35–45 мин',
    deliveryFee: '149 ₽',
    imageUrl:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    logoUrl: DEMO_LOGO,
  },
];
