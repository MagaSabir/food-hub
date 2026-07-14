/**
 * Сид Этапа 1: город Грозный + несколько брендов (каждый с 1 авто-точкой).
 * Расширен для правдоподобного демо каталога (экран 1.5): реалистичные кухни и
 * рейтинги. ВНИМАНИЕ: рейтинги здесь — ДЕМО-значения; реально они агрегируются из
 * отзывов на Этапе 10 (см. reviews-ratings-model). Фото — уровень приложения/Этап 8.
 *
 * Идемпотентный: upsert по фиксированным id (create И update) → можно гонять
 * повторно (в т.ч. авто-запуск после `migrate reset`), данные обновляются.
 */
import { config as loadEnv } from 'dotenv';

// env — теми же слоями, что app и prisma.config (специфичный перебивает базовый).
const NODE_ENV = process.env.NODE_ENV ?? 'development';
loadEnv({ path: `env/.env.${NODE_ENV}` });
loadEnv({ path: 'env/.env' });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Рабочие часы 10:00–22:00 каждый день (jsonb).
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

const CITY_ID = '11111111-1111-1111-1111-111111111111';

// Каждый бренд + его единственная точка. id фиксированы → идемпотентность.
const RESTAURANTS = [
    {
        id: '22222222-0000-0000-0000-000000000001',
        name: 'Сыроварня',
        slug: 'syrovarnya',
        description: 'Итальянская кухня и пицца на дровах',
        cuisineTypes: ['Итальянская', 'Пицца', 'Паста'],
        ratingFood: 4.8,
        ratingDelivery: 4.7,
        reviewsCount: 512,
        branch: {
            id: '33333333-0000-0000-0000-000000000001',
            address: 'пр. В. Путина, 1',
            latitude: 43.3178,
            longitude: 45.6949,
            // «Бесплатная доставка» (base 0, per_km 0)
            deliveryBaseFee: 0,
            deliveryPerKm: 0,
        },
    },
    {
        id: '22222222-0000-0000-0000-000000000002',
        name: 'Tokyo Sushi',
        slug: 'tokyo-sushi',
        description: 'Суши и роллы, японская кухня',
        cuisineTypes: ['Суши', 'Роллы', 'Японская'],
        ratingFood: 4.7,
        ratingDelivery: 4.5,
        reviewsCount: 340,
        branch: {
            id: '33333333-0000-0000-0000-000000000002',
            address: 'ул. Шейха Али Митаева, 14',
            latitude: 43.3205,
            longitude: 45.698,
            deliveryBaseFee: 149,
            deliveryPerKm: 20,
        },
    },
    {
        id: '22222222-0000-0000-0000-000000000003',
        name: 'Black Star Burger',
        slug: 'black-star-burger',
        description: 'Бургеры и американская кухня',
        cuisineTypes: ['Бургеры', 'Американская'],
        ratingFood: 4.6,
        ratingDelivery: 4.6,
        reviewsCount: 1200,
        branch: {
            id: '33333333-0000-0000-0000-000000000003',
            address: 'пр. М. Эсамбаева, 7',
            latitude: 43.315,
            longitude: 45.691,
            deliveryBaseFee: 0,
            deliveryPerKm: 0,
        },
    },
    {
        id: '22222222-0000-0000-0000-000000000004',
        name: 'Урарту',
        slug: 'urartu',
        description: 'Кавказская кухня, шашлык на углях',
        cuisineTypes: ['Кавказская', 'Шашлык'],
        ratingFood: 4.9,
        ratingDelivery: 4.8,
        reviewsCount: 875,
        branch: {
            id: '33333333-0000-0000-0000-000000000004',
            address: 'ул. Маяковского, 42',
            latitude: 43.309,
            longitude: 45.702,
            deliveryBaseFee: 100,
            deliveryPerKm: 30,
        },
    },
    {
        id: '22222222-0000-0000-0000-000000000005',
        name: 'Утро',
        slug: 'utro',
        description: 'Завтраки, кофе и выпечка весь день',
        cuisineTypes: ['Завтраки', 'Кофе', 'Выпечка'],
        ratingFood: 4.5,
        ratingDelivery: 4.4,
        reviewsCount: 210,
        branch: {
            id: '33333333-0000-0000-0000-000000000005',
            address: 'пр. Х. Исаева, 99',
            latitude: 43.323,
            longitude: 45.688,
            deliveryBaseFee: 99,
            deliveryPerKm: 25,
        },
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Васаби',
        slug: 'vasabi',
        description: 'Суши и роллы с доставкой по Грозному',
        cuisineTypes: ['Суши', 'Роллы'],
        ratingFood: 4.4,
        ratingDelivery: 4.3,
        reviewsCount: 128,
        branch: {
            id: '33333333-3333-3333-3333-333333333333',
            address: 'пр. Мохаммеда Али, 5',
            latitude: 43.3178,
            longitude: 45.6949,
            deliveryBaseFee: 120,
            deliveryPerKm: 30,
        },
    },
];

async function main(): Promise<void> {
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
                ratingFood: r.ratingFood,
                ratingDelivery: r.ratingDelivery,
                reviewsCount: r.reviewsCount,
            };
            await prisma.restaurant.upsert({
                where: { id: r.id },
                update: brand,
                create: { id: r.id, ...brand },
            });

            const branch = {
                restaurantId: r.id,
                cityId: city.id,
                address: r.branch.address,
                phone: '+7 928 000-00-00',
                latitude: r.branch.latitude,
                longitude: r.branch.longitude,
                workingHours,
                minOrderAmount: 500,
                deliveryBaseFee: r.branch.deliveryBaseFee,
                deliveryIncludedRadiusKm: 2,
                deliveryPerKm: r.branch.deliveryPerKm,
                deliveryMaxRadiusKm: 10,
                freeDeliveryMinOrder: 1500,
            };
            await prisma.branch.upsert({
                where: { id: r.branch.id },
                update: branch,
                create: { id: r.branch.id, ...branch },
            });
        }

        console.log(`Сид готов: город ${city.name}, брендов: ${RESTAURANTS.length}`);
        for (const r of RESTAURANTS) {
            console.log(`  • ${r.name} — ${r.cuisineTypes.join(' · ')} (★ ${r.ratingFood})`);
        }
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main().catch((e) => {
    console.error('Сид упал:', e);
    process.exit(1);
});
