import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { ItemType, ModifierType } from '@prisma/client';

export function uid(key: string): string {
  const h = createHash('sha1').update(`foodhub:${key}`).digest('hex');
  const version = `5${h.slice(13, 16)}`;
  const variant =
    ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16) + h.slice(17, 20);
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    version,
    variant,
    h.slice(20, 32),
  ].join('-');
}

interface SeedOption {
  key: string;
  name: string;
  priceDelta?: number;
}

interface SeedGroup {
  key: string;
  name: string;
  type: ModifierType;
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number | null;
  options: SeedOption[];
}

interface SeedItem {
  key: string;
  name: string;
  itemType?: ItemType;
  composition?: string;
  description?: string;
  weight?: string;
  volume?: string;
  calories?: number;
  price: number;
  discountPrice?: number;
  photos?: string[];
  isAvailable?: boolean;
  groups?: SeedGroup[];
}

interface SeedCategory {
  key: string;
  name: string;
  items: SeedItem[];
}

const photo = (id: string): string[] => [
  `https://images.unsplash.com/${id}?w=600&q=80`,
];

const pizzaSize = (): SeedGroup => ({
  key: 'size',
  name: 'Размер',
  type: ModifierType.SINGLE,
  isRequired: true,
  minSelections: 1,
  maxSelections: 1,
  options: [
    { key: 'sm', name: '25 см' },
    { key: 'md', name: '30 см', priceDelta: 150 },
    { key: 'lg', name: '35 см', priceDelta: 300 },
  ],
});

export const MENUS: Record<string, SeedCategory[]> = {
  syrovarnya: [
    {
      key: 'pizza',
      name: 'Пицца',
      items: [
        {
          key: 'margarita',
          name: 'Пицца Маргарита',
          composition: 'Томатный соус, моцарелла, свежий базилик',
          price: 590,
          weight: '480 г',
          calories: 1100,
          photos: photo('photo-1574071318508-1cdbab80d002'),
          groups: [
            pizzaSize(),
            {
              key: 'extra',
              name: 'Добавки',
              type: ModifierType.MULTIPLE,
              maxSelections: 3,
              options: [
                { key: 'cheese', name: 'Двойной сыр', priceDelta: 120 },
                { key: 'tomato', name: 'Томаты черри', priceDelta: 90 },
                { key: 'basil', name: 'Базилик', priceDelta: 50 },
              ],
            },
          ],
        },
        {
          key: 'pepperoni',
          name: 'Пепперони',
          composition: 'Томатный соус, моцарелла, пепперони',
          price: 590,
          weight: '500 г',
          calories: 1320,
          photos: photo('photo-1628840042765-356cda07504e'),
          groups: [pizzaSize()],
        },
        {
          key: 'quattro-formaggi',
          name: 'Четыре сыра',
          composition:
            'Моцарелла, горгонзола, пармезан, дорблю, сливочный соус',
          price: 690,
          weight: '520 г',
          calories: 1450,
          photos: photo('photo-1513104890138-7c749659a591'),
          groups: [pizzaSize()],
        },
      ],
    },
    {
      key: 'pasta',
      name: 'Паста',
      items: [
        {
          key: 'carbonara',
          name: 'Паста Карбонара',
          composition: 'Паста, бекон, сливочный соус, пармезан',
          price: 490,
          weight: '320 г',
          photos: photo('photo-1612874742237-6526221588e3'),
        },
        {
          key: 'bolognese',
          name: 'Паста Болоньезе',
          composition: 'Паста, говяжий фарш, томатный соус, пармезан',
          price: 520,
          weight: '340 г',
          photos: photo('photo-1621996346565-e3dbc646d9a9'),
        },
      ],
    },
    {
      key: 'salads',
      name: 'Салаты',
      items: [
        {
          key: 'caesar',
          name: 'Цезарь с курицей',
          composition: 'Романо, курица гриль, пармезан, соус цезарь, гренки',
          price: 450,
          weight: '250 г',
          photos: photo('photo-1550304943-4f24f54ddde9'),
        },
      ],
    },
    {
      key: 'desserts',
      name: 'Десерты',
      items: [
        {
          key: 'tiramisu',
          name: 'Тирамису',
          composition: 'Маскарпоне, савоярди, эспрессо, какао',
          price: 390,
          weight: '150 г',
          photos: photo('photo-1571877227200-a0d98ea607e9'),
        },
      ],
    },
    {
      key: 'drinks',
      name: 'Напитки',
      items: [
        {
          key: 'lemonade',
          name: 'Лимонад домашний',
          itemType: ItemType.DRINK,
          composition: 'Лимон, мята, содовая, сироп',
          price: 250,
          volume: '0.4 л',
          photos: photo('photo-1621263764928-df1444c5e859'),
          groups: [
            {
              key: 'volume',
              name: 'Объём',
              type: ModifierType.SINGLE,
              isRequired: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                { key: 'sm', name: '0.4 л' },
                { key: 'lg', name: '1 л', priceDelta: 200 },
              ],
            },
          ],
        },
      ],
    },
  ],

  'tokyo-sushi': [
    {
      key: 'rolls',
      name: 'Роллы',
      items: [
        {
          key: 'philadelphia',
          name: 'Филадельфия',
          composition: 'Лосось, сливочный сыр, рис, нори',
          price: 620,
          weight: '260 г',
          photos: photo('photo-1579871494447-9811cf80d66c'),
          groups: [
            {
              key: 'extra',
              name: 'Дополнительно',
              type: ModifierType.MULTIPLE,
              maxSelections: null,
              options: [
                { key: 'soy', name: 'Соевый соус', priceDelta: 30 },
                { key: 'ginger', name: 'Имбирь', priceDelta: 40 },
                { key: 'wasabi', name: 'Васаби', priceDelta: 40 },
              ],
            },
          ],
        },
        {
          key: 'california',
          name: 'Калифорния',
          composition: 'Краб, авокадо, огурец, икра тобико',
          price: 540,
          discountPrice: 449,
          weight: '250 г',
          photos: photo('photo-1553621042-f6e147245754'),
        },
      ],
    },
    {
      key: 'soups',
      name: 'Супы',
      items: [
        {
          key: 'miso',
          name: 'Мисо-суп',
          composition: 'Тофу, водоросли вакаме, зелёный лук',
          price: 240,
          volume: '300 мл',
          photos: photo('photo-1607301405390-d831c242f59b'),
        },
      ],
    },
  ],

  'black-star-burger': [
    {
      key: 'burgers',
      name: 'Бургеры',
      items: [
        {
          key: 'classic',
          name: 'Классический бургер',
          composition: 'Мраморная говядина, чеддер, томат, соус',
          price: 490,
          weight: '320 г',
          calories: 780,
          photos: photo('photo-1568901346375-23c9450c58cd'),
          groups: [
            {
              key: 'patty',
              name: 'Котлета',
              type: ModifierType.SINGLE,
              isRequired: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                { key: 'single', name: 'Одна' },
                { key: 'double', name: 'Двойная', priceDelta: 220 },
              ],
            },
            {
              key: 'extra',
              name: 'Добавки',
              type: ModifierType.MULTIPLE,
              maxSelections: 4,
              options: [
                { key: 'bacon', name: 'Бекон', priceDelta: 120 },
                { key: 'cheese', name: 'Доп. сыр', priceDelta: 90 },
                { key: 'jalapeno', name: 'Халапеньо', priceDelta: 60 },
                { key: 'no-sauce', name: 'Без соуса', priceDelta: -20 },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'sides',
      name: 'Закуски',
      items: [
        {
          key: 'fries',
          name: 'Картофель фри',
          composition: 'Картофель, соль',
          price: 190,
          weight: '150 г',
          photos: photo('photo-1573080496219-bb080dd4f877'),
        },
        {
          key: 'cola',
          name: 'Кола',
          itemType: ItemType.DRINK,
          price: 150,
          volume: '0.5 л',
          isAvailable: false,
          photos: photo('photo-1554866585-cd94860890b7'),
        },
      ],
    },
  ],

  urartu: [
    {
      key: 'grill',
      name: 'Шашлык',
      items: [
        {
          key: 'lamb',
          name: 'Шашлык из баранины',
          composition: 'Баранина, лук, специи',
          price: 890,
          weight: '250 г',
          photos: photo('photo-1529193591184-b1d58069ecdd'),
        },
        {
          key: 'chicken',
          name: 'Шашлык из курицы',
          composition: 'Куриное бедро, маринад, зелень',
          price: 620,
          weight: '250 г',
          photos: photo('photo-1598515214211-89d3c73ae83b'),
        },
      ],
    },
    {
      key: 'bread',
      name: 'Хлеб и соусы',
      items: [
        {
          key: 'lavash',
          name: 'Лаваш',
          price: 80,
          weight: '100 г',
          photos: photo('photo-1509440159596-0249088772ff'),
        },
      ],
    },
  ],

  utro: [
    {
      key: 'breakfast',
      name: 'Завтраки',
      items: [
        {
          key: 'syrniki',
          name: 'Сырники со сметаной',
          composition: 'Творог, мука, ваниль, сметана',
          price: 380,
          weight: '220 г',
          photos: photo('photo-1567620905732-2d1ec7ab7445'),
        },
        {
          key: 'omelette',
          name: 'Омлет с овощами',
          composition: 'Яйцо, томаты, шпинат, сыр',
          price: 340,
          weight: '200 г',
          photos: photo('photo-1525351484163-7529414344d8'),
        },
      ],
    },
    {
      key: 'coffee',
      name: 'Кофе',
      items: [
        {
          key: 'cappuccino',
          name: 'Капучино',
          itemType: ItemType.DRINK,
          price: 260,
          volume: '300 мл',
          photos: photo('photo-1572442388796-11668a67e53d'),
          groups: [
            {
              key: 'milk',
              name: 'Молоко',
              type: ModifierType.SINGLE,
              isRequired: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                { key: 'regular', name: 'Обычное' },
                { key: 'oat', name: 'Овсяное', priceDelta: 70 },
                { key: 'lactose-free', name: 'Безлактозное', priceDelta: 70 },
              ],
            },
            {
              key: 'syrup',
              name: 'Сироп',
              type: ModifierType.MULTIPLE,
              maxSelections: 2,
              options: [
                { key: 'caramel', name: 'Карамель', priceDelta: 60 },
                { key: 'vanilla', name: 'Ваниль', priceDelta: 60 },
              ],
            },
          ],
        },
      ],
    },
  ],

  vasabi: [
    {
      key: 'sets',
      name: 'Сеты',
      items: [
        {
          key: 'set-family',
          name: 'Сет «Семейный»',
          description:
            '40 кусочков: Филадельфия, Калифорния, Дракон, Запечённый',
          price: 2190,
          discountPrice: 1790,
          weight: '1200 г',
          photos: photo('photo-1583623025817-d180a2221d0a'),
        },
      ],
    },
    {
      key: 'rolls',
      name: 'Роллы',
      items: [
        {
          key: 'dragon',
          name: 'Дракон',
          composition: 'Угорь, огурец, соус унаги, кунжут',
          price: 690,
          weight: '270 г',
          photos: photo('photo-1617196034796-73dfa7b1fd56'),
        },
      ],
    },
  ],
};

export async function seedMenu(
  prisma: PrismaClient,
  restaurants: { id: string; slug: string }[],
): Promise<number> {
  let itemsCount = 0;

  for (const { id: restaurantId, slug } of restaurants) {
    const categories = MENUS[slug];
    if (!categories) continue;

    const keptCategoryIds: string[] = [];
    const keptItemIds: string[] = [];

    for (const [categoryIndex, category] of categories.entries()) {
      const categoryId = uid(`category:${slug}:${category.key}`);
      keptCategoryIds.push(categoryId);

      const categoryData = {
        restaurantId,
        name: category.name,
        sortOrder: categoryIndex,
        isActive: true,
      };
      await prisma.menuCategory.upsert({
        where: { id: categoryId },
        update: categoryData,
        create: { id: categoryId, ...categoryData },
      });

      for (const [itemIndex, item] of category.items.entries()) {
        const itemId = uid(`item:${slug}:${item.key}`);
        keptItemIds.push(itemId);

        const itemData = {
          restaurantId,
          categoryId,
          itemType: item.itemType ?? ItemType.DISH,
          name: item.name,
          description: item.description ?? null,
          composition: item.composition ?? null,
          weight: item.weight ?? null,
          volume: item.volume ?? null,
          calories: item.calories ?? null,
          price: item.price,
          discountPrice: item.discountPrice ?? null,
          discountUntil: null,
          photos: item.photos ?? [],
          isAvailable: item.isAvailable ?? true,
          sortOrder: itemIndex,
        };
        await prisma.menuItem.upsert({
          where: { id: itemId },
          update: itemData,
          create: { id: itemId, ...itemData },
        });
        itemsCount += 1;

        const groups = item.groups ?? [];
        for (const [groupIndex, group] of groups.entries()) {
          const groupId = uid(`group:${slug}:${item.key}:${group.key}`);
          const groupData = {
            menuItemId: itemId,
            name: group.name,
            type: group.type,
            isRequired: group.isRequired ?? false,
            minSelections: group.minSelections ?? 0,
            maxSelections: group.maxSelections ?? null,
            sortOrder: groupIndex,
          };
          await prisma.modifierGroup.upsert({
            where: { id: groupId },
            update: groupData,
            create: { id: groupId, ...groupData },
          });

          for (const [optionIndex, option] of group.options.entries()) {
            const optionId = uid(
              `option:${slug}:${item.key}:${group.key}:${option.key}`,
            );
            const optionData = {
              modifierGroupId: groupId,
              name: option.name,
              priceDelta: option.priceDelta ?? 0,
              isAvailable: true,
              sortOrder: optionIndex,
            };
            await prisma.modifierOption.upsert({
              where: { id: optionId },
              update: optionData,
              create: { id: optionId, ...optionData },
            });
          }

          const optionIds = group.options.map((o) =>
            uid(`option:${slug}:${item.key}:${group.key}:${o.key}`),
          );
          await prisma.modifierOption.deleteMany({
            where: { modifierGroupId: groupId, id: { notIn: optionIds } },
          });
        }

        const groupIds = groups.map((g) =>
          uid(`group:${slug}:${item.key}:${g.key}`),
        );
        await prisma.modifierGroup.deleteMany({
          where: { menuItemId: itemId, id: { notIn: groupIds } },
        });
      }
    }

    await prisma.menuItem.deleteMany({
      where: { restaurantId, id: { notIn: keptItemIds } },
    });
    await prisma.menuCategory.deleteMany({
      where: { restaurantId, id: { notIn: keptCategoryIds } },
    });
  }

  return itemsCount;
}
