import { DishCardProps } from '@/entities/menu';

export interface MockMenuCategory {
  id: string;
  title: string;
  dishes: DishCardProps[];
}

export const MOCK_RESTAURANT = {
  name: 'Сыроварня',
  cuisine: 'Итальянская кухня • Пицца • Паста',
  logo: require('@/assets/images/944341_ODUJEJ1.svg'),

  photos: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&q=80',
  ],
  ratingOverall: 4.8,
  ratingFood: 4.9,
  ratingDelivery: 4.7,
  reviewsCount: 12458,
  deliveryTime: '30–40 мин',
  freeDeliveryFrom: '990 ₽',
  openUntil: 'до 23:00',
};

export const MOCK_MENU: MockMenuCategory[] = [
  {
    id: 'pizza',
    title: 'Пицца',
    dishes: [
      {
        id: 'margarita',
        name: 'Пицца Маргарита',
        composition: 'Томатный соус, моцарелла, свежий базилик',
        price: 590,
        badge: 'hit',
        imageUrl:
          'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
      },
      {
        id: 'pepperoni',
        name: 'Пепперони',
        composition: 'Томатный соус, моцарелла, пепперони',
        price: 590,
        imageUrl:
          'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80',
      },
      {
        id: 'quattro-formaggi',
        name: 'Четыре сыра',
        composition: 'Моцарелла, горгонзола, пармезан, дорблю, сливочный соус',
        price: 690,
        badge: 'new',
        imageUrl:
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
      },
    ],
  },
  {
    id: 'pasta',
    title: 'Паста',
    dishes: [
      {
        id: 'carbonara',
        name: 'Паста Карбонара',
        composition: 'Паста, бекон, сливочный соус, пармезан',
        price: 490,
        badge: 'popular',
        imageUrl:
          'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80',
      },
      {
        id: 'bolognese',
        name: 'Паста Болоньезе',
        composition: 'Паста, говяжий фарш, томатный соус, пармезан',
        price: 520,
        imageUrl:
          'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
      },
    ],
  },
  {
    id: 'salads',
    title: 'Салаты',
    dishes: [
      {
        id: 'caesar',
        name: 'Цезарь с курицей',
        composition: 'Романо, курица гриль, пармезан, соус цезарь, гренки',
        price: 450,
        imageUrl:
          'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80',
      },
    ],
  },
  {
    id: 'desserts',
    title: 'Десерты',
    dishes: [
      {
        id: 'tiramisu',
        name: 'Тирамису',
        composition: 'Маскарпоне, савоярди, эспрессо, какао',
        price: 390,
        imageUrl:
          'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80',
      },
    ],
  },
  {
    id: 'drinks',
    title: 'Напитки',
    dishes: [
      {
        id: 'lemonade',
        name: 'Лимонад домашний',
        composition: 'Лимон, мята, содовая, сироп',
        price: 250,
        imageUrl:
          'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80',
      },
    ],
  },
];
