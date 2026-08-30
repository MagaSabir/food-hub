import { config as loadEnv} from 'dotenv'
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const NODE_ENV = process.env.NODE_ENV ?? 'development'
loadEnv({ path : `env/.env.${NODE_ENV}`})
loadEnv({ path : `env/.env`})

const everyDay = { from: '10:00', to: '22:00' };

const workingHours = {
  mon: [everyDay],
  tue: [everyDay],
  wed: [everyDay],
  thu: [everyDay],
  fri: [everyDay],
  sat: [everyDay],
  sun: [everyDay],
};

const shortDay = { from: '09:00', to: '18:00'}
const earlyClosing = {
  mon: [shortDay],
  tue: [shortDay],
  wed: [shortDay],
  thu: [shortDay],
  fri: [shortDay],
  sat: [shortDay],
  sun: [shortDay],
}

const CITY_ID = '11111111-1111-1111-1111-111111111111';

interface SeedBranch {
  id: string;
  name: string | null;
  address: string;
  latitude: number;
  longitude: number;
  deliveryBaseFee: number;
  deliveryPerKm: number;

  workingHours?: typeof workingHours;
  hasDelivery?: boolean;
  hasPickup?: boolean;
  hasDineIn?: boolean;
}

interface SeedRestaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  cuisineTypes: string[];
  logoUrl: string;

  ratingFood: number;
  ratingDelivery: number;
  reviewsCount: number;
  branches: SeedBranch[];
}

const RESTAURANTS: SeedRestaurant[] = [
  {
    id: '22222222-0000-0000-0000-000000000001',
    name: 'Сыроварня',
    logoUrl:
      'https://api.dicebear.com/9.x/icons/png?seed=syrovarnya&icon=award&backgroundColor=c62828&radius=20&size=256',

    slug: 'syrovarnya',
    description: 'Итальянская кухня и пицца на дровах',
    cuisineTypes: ['Итальянская', 'Пицца', 'Паста'],
    ratingFood: 4.8,
    ratingDelivery: 4.7,
    reviewsCount: 512,
    branches: [
      {
        id: '33333333-0000-0000-0000-000000000001',
        name: 'На Путина',
        address: 'пр. В. Путина, 1',
        latitude: 43.3178,
        longitude: 45.6949,
        // «Бесплатная доставка» (base 0, per_km 0)
        deliveryBaseFee: 0,
        deliveryPerKm: 0,
      },
      {
        id: '33333333-0000-0000-0000-000000000011',
        name: 'В Грозный-Сити',
        address: 'пр. А.-Х. Кадырова, 12',
        latitude: 43.312,
        longitude: 45.689,
        deliveryBaseFee: 0,
        deliveryPerKm: 0,
        // Не возит: кухня в фуд-корте, курьеров нет. Заказ на доставку сюда
        // не попадёт — сервер выберет другую точку бренда.
        hasDelivery: false,
      },
      {
        id: '33333333-0000-0000-0000-000000000012',
        name: 'На Дудаева',
        address: 'б-р Дудаева, 30',
        latitude: 43.325,
        longitude: 45.7,
        deliveryBaseFee: 149,
        deliveryPerKm: 20,
        // Закрывается в 18:00 и не имеет зала — на ней видно и «закрыто»,
        // и то, что список точек зависит от выбранного типа заказа.
        workingHours: earlyClosing,
        hasDineIn: false,
      },
    ],
  },
  {
    id: '22222222-0000-0000-0000-000000000002',
    name: 'Tokyo Sushi',
    logoUrl:
      'https://api.dicebear.com/9.x/icons/png?seed=tokyo-sushi&icon=moonStars&backgroundColor=283593&radius=20&size=256',

    slug: 'tokyo-sushi',
    description: 'Суши и роллы, японская кухня',
    cuisineTypes: ['Суши', 'Роллы', 'Японская'],
    ratingFood: 4.7,
    ratingDelivery: 4.5,
    reviewsCount: 340,
    branches: [
      {
        id: '33333333-0000-0000-0000-000000000002',
        name: 'На Митаева',
        address: 'ул. Шейха Али Митаева, 14',
        latitude: 43.3205,
        longitude: 45.698,
        deliveryBaseFee: 149,
        deliveryPerKm: 20,
      },
      {
        id: '33333333-0000-0000-0000-000000000021',
        name: 'На Мира',
        address: 'ул. Мира, 25',
        latitude: 43.329,
        longitude: 45.689,
        deliveryBaseFee: 149,
        deliveryPerKm: 20,
      },
    ],
  },
  {
    id: '22222222-0000-0000-0000-000000000003',
    name: 'Black Star Burger',
    logoUrl:
      'https://api.dicebear.com/9.x/icons/png?seed=black-star-burger&icon=star&backgroundColor=111827&radius=20&size=256',

    slug: 'black-star-burger',
    description: 'Бургеры и американская кухня',
    cuisineTypes: ['Бургеры', 'Американская'],
    ratingFood: 4.6,
    ratingDelivery: 4.6,
    reviewsCount: 1200,
    branches: [
      {
        name: null,
        id: '33333333-0000-0000-0000-000000000003',
        address: 'пр. М. Эсамбаева, 7',
        latitude: 43.315,
        longitude: 45.691,
        deliveryBaseFee: 0,
        deliveryPerKm: 0,
      },
    ],
  },
  {
    id: '22222222-0000-0000-0000-000000000004',
    name: 'Урарту',
    logoUrl:
      'https://api.dicebear.com/9.x/icons/png?seed=urartu&icon=gem&backgroundColor=b45309&radius=20&size=256',

    slug: 'urartu',
    description: 'Кавказская кухня, шашлык на углях',
    cuisineTypes: ['Кавказская', 'Шашлык'],
    ratingFood: 4.9,
    ratingDelivery: 4.8,
    reviewsCount: 875,
    branches: [
      {
        name: null,
        id: '33333333-0000-0000-0000-000000000004',
        address: 'ул. Маяковского, 42',
        latitude: 43.309,
        longitude: 45.702,
        deliveryBaseFee: 100,
        deliveryPerKm: 30,
      },
    ],
  },
  {
    id: '22222222-0000-0000-0000-000000000005',
    name: 'Утро',
    logoUrl:
      'https://api.dicebear.com/9.x/icons/png?seed=utro&icon=sun&backgroundColor=f59e0b&radius=20&size=256',

    slug: 'utro',
    description: 'Завтраки, кофе и выпечка весь день',
    cuisineTypes: ['Завтраки', 'Кофе', 'Выпечка'],
    ratingFood: 4.5,
    ratingDelivery: 4.4,
    reviewsCount: 210,
    branches: [
      {
        name: null,
        id: '33333333-0000-0000-0000-000000000005',
        address: 'пр. Х. Исаева, 99',
        latitude: 43.323,
        longitude: 45.688,
        deliveryBaseFee: 99,
        deliveryPerKm: 25,
      },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Васаби',
    logoUrl:
      'https://api.dicebear.com/9.x/icons/png?seed=vasabi&icon=flower2&backgroundColor=4caf50&radius=20&size=256',

    slug: 'vasabi',
    description: 'Суши и роллы с доставкой по Грозному',
    cuisineTypes: ['Суши', 'Роллы'],
    ratingFood: 4.4,
    ratingDelivery: 4.3,
    reviewsCount: 128,
    branches: [
      {
        name: null,
        id: '33333333-3333-3333-3333-333333333333',
        address: 'пр. Мохаммеда Али, 5',
        latitude: 43.3178,
        longitude: 45.6949,
        deliveryBaseFee: 120,
        deliveryPerKm: 30,
      },
    ],
  },
];


async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Сид запущен в проде');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const city = await prisma.city.upsert({
      where: { id: CITY_ID },
      update: { name: 'Грозный', slug: 'grozny' },
      create: {id: CITY_ID, name: 'Грозный', slug: 'grozny'},
    })

    for (const r of RESTAURANTS) {
      const brand = {
        name: r.name,
        slug: r.slug,
        description: r.description,
        cuisineTypes: r.cuisineTypes,
        logoUrl: r.logoUrl,
        ratingFood: r.ratingFood,
        ratingDelivery: r.ratingDelivery,
        reviewsCount: r.reviewsCount,
      };
      await prisma.restaurant.upsert({
        where: { id: r.id },
        update: brand,
        create: { id: r.id, ...brand},
      });

      for (const b of r.branches) {
        const branch = {
          restaurantId: r.id,
          cityId: city.id,
          name: b.name,
          address: b.address,
          phone: '+7 916 123 45 67',
          latitude: b.latitude,
          longitude: b.longitude,
          workingHours: b.workingHours ?? workingHours,
          hasDelivery: b.hasDelivery ?? true,
          hasPickup: b.hasPickup ?? true,
          hasDineIn: b.hasDineIn ?? true,
          minOrderAmount: 500,
          deliveryBaseFee: b.deliveryBaseFee,
          deliveryPerKm: b.deliveryPerKm,
          deliveryMaxRadiusKm: 10,
          freeDeliveryMinOrder: 1500,
        };
        await prisma.branch.upsert({
          where: { id: b.id},
          update: branch,
          create: { id: b.id, ...branch },
        })
      }
    }
    console.log(
      `Сид готов: город ${city.name}, брендов: ${RESTAURANTS.length}`,
    );
    for (const r of RESTAURANTS) {
      const points =
        r.branches.length > 1 ? `, точек: ${r.branches.length}` : '';
      console.log(
        `  • ${r.name} — ${r.cuisineTypes.join(' · ')} (★ ${r.ratingFood})${points}`,
      );
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});