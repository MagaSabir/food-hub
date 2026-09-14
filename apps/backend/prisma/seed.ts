import { config as loadEnv } from 'dotenv';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
loadEnv({ path: `env/.env.${NODE_ENV}` });
loadEnv({ path: 'env/.env' });

import { hash } from '@node-rs/argon2';
import { ARGON2_OPTIONS } from '../src/auth/domain/policies/password.policy';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { Pool } from 'pg';
import { seedMenu } from './seed-menu';

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

const shortDay = { from: '09:00', to: '18:00' };
const earlyClosing = {
  mon: [shortDay],
  tue: [shortDay],
  wed: [shortDay],
  thu: [shortDay],
  fri: [shortDay],
  sat: [shortDay],
  sun: [shortDay],
};

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
  photos: string[];
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
    photos: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80',
      'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=1200&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200&q=80',
    ],
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
    photos: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=80',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1200&q=80',
    ],
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
    photos: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80',
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&q=80',
    ],
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
    photos: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80',
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&q=80',
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=1200&q=80',
    ],
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
    photos: [
      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=1200&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80',
    ],
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
    photos: [
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=80',
      'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=1200&q=80',
      'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=1200&q=80',
      'https://images.unsplash.com/photo-1606502281004-f86cf1282af5?w=1200&q=80',
    ],
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

const PLATFORM_ADMIN = {
  id: '44444444-0000-0000-0000-000000000001',
  email: 'admin@foodhub.local',
  password: 'Admin12345!',
};

const RESTAURANT_STAFF = {
  id: '55555555-0000-0000-0000-000000000001',
  email: 'owner@syrovarnya.local',
  password: 'Owner12345!',
  restaurantId: '22222222-0000-0000-0000-000000000001',
  role: Role.RESTAURANT_OWNER,
};

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Сид запрещён в production (создаёт тестовые аккаунты)');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const city = await prisma.city.upsert({
      where: { id: CITY_ID },
      update: { name: 'Грозный', slug: 'grozny' },
      create: { id: CITY_ID, name: 'Грозный', slug: 'grozny' },
    });

    for (const r of RESTAURANTS) {
      const brand = {
        name: r.name,
        slug: r.slug,
        description: r.description,
        cuisineTypes: r.cuisineTypes,
        logoUrl: r.logoUrl,
        photos: r.photos,
        ratingFood: r.ratingFood,
        ratingDelivery: r.ratingDelivery,
        reviewsCount: r.reviewsCount,
      };
      await prisma.restaurant.upsert({
        where: { id: r.id },
        update: brand,
        create: { id: r.id, ...brand },
      });

      for (const b of r.branches) {
        const branch = {
          restaurantId: r.id,
          cityId: city.id,
          name: b.name,
          address: b.address,
          phone: '+7 928 000-00-00',
          latitude: b.latitude,
          longitude: b.longitude,
          workingHours: b.workingHours ?? workingHours,
          hasDelivery: b.hasDelivery ?? true,
          hasPickup: b.hasPickup ?? true,
          hasDineIn: b.hasDineIn ?? true,
          minOrderAmount: 500,
          deliveryBaseFee: b.deliveryBaseFee,
          deliveryIncludedRadiusKm: 2,
          deliveryPerKm: b.deliveryPerKm,
          deliveryMaxRadiusKm: 10,
          freeDeliveryMinOrder: 1500,
        };
        await prisma.branch.upsert({
          where: { id: b.id },
          update: branch,
          create: { id: b.id, ...branch },
        });
      }
    }

    const menuItems = await seedMenu(prisma, RESTAURANTS);

    const adminHash = await hash(PLATFORM_ADMIN.password, ARGON2_OPTIONS);
    await prisma.platformAdmin.upsert({
      where: { id: PLATFORM_ADMIN.id },
      update: { email: PLATFORM_ADMIN.email, passwordHash: adminHash },
      create: {
        id: PLATFORM_ADMIN.id,
        email: PLATFORM_ADMIN.email,
        passwordHash: adminHash,
      },
    });

    const staffHash = await hash(RESTAURANT_STAFF.password, ARGON2_OPTIONS);
    const staff = {
      email: RESTAURANT_STAFF.email,
      passwordHash: staffHash,
      role: RESTAURANT_STAFF.role,
      restaurantId: RESTAURANT_STAFF.restaurantId,
      branchId: null,
    };
    await prisma.staffUser.upsert({
      where: { id: RESTAURANT_STAFF.id },
      update: staff,
      create: { id: RESTAURANT_STAFF.id, ...staff },
    });

    console.log(
      `Сид готов: город ${city.name}, брендов: ${RESTAURANTS.length}, позиций меню: ${menuItems}`,
    );
    for (const r of RESTAURANTS) {
      const points =
        r.branches.length > 1 ? `, точек: ${r.branches.length}` : '';
      console.log(
        `  • ${r.name} — ${r.cuisineTypes.join(' · ')} (★ ${r.ratingFood})${points}`,
      );
    }
    console.log('Тестовые аккаунты (только dev):');
    console.log(
      `  • PLATFORM_ADMIN    ${PLATFORM_ADMIN.email} / ${PLATFORM_ADMIN.password}`,
    );
    console.log(
      `  • RESTAURANT_OWNER  ${RESTAURANT_STAFF.email} / ${RESTAURANT_STAFF.password}`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('Сид упал:', e);
  process.exit(1);
});
