import { ModifierType } from '@foodhubme/shared';
import { Prisma } from '@prisma/client';
import { MenuItemNotFoundError } from '../../../menu/errors/menu.errors';
import {
  InvalidModifiersError,
  MenuItemUnavailableError,
} from '../errors/orders.errors';
import {
  calculateOrderItems,
  OrderableGroup,
  OrderableItem,
} from './order-lines';

const d = (value: string | number) => new Prisma.Decimal(value);
const NOW = new Date('2026-08-14T12:00:00Z');

const option = (
  id: string,
  name: string,
  priceDelta: number,
  isAvailable = true,
) => ({ id, name, priceDelta: d(priceDelta), isAvailable });

const group = (over: Partial<OrderableGroup> = {}): OrderableGroup => ({
  id: 'g1',
  name: 'Размер',
  type: ModifierType.SINGLE,
  isRequired: false,
  minSelections: 0,
  maxSelections: null,
  options: [option('o30', '30 см', 100), option('o25', '25 см', 0)],
  ...over,
});

const item = (over: Partial<OrderableItem> = {}): OrderableItem => ({
  id: 'i1',
  name: 'Маргарита',
  photos: ['https://cdn.local/margarita.jpg'],
  price: d(500),
  discountPrice: null,
  discountUntil: null,
  isAvailable: true,
  modifierGroups: [],
  ...over,
});

describe('calculateOrderItems', () => {
  describe('суммы', () => {
    it('одна позиция без модификаторов: цена × количество', () => {
      const { lines, itemsTotal } = calculateOrderItems(
        [{ menuItemId: 'i1', quantity: 3, optionIds: [] }],
        [item()],
        NOW,
      );

      expect(lines).toHaveLength(1);
      expect(lines[0].lineTotal.toString()).toBe('1500');
      expect(itemsTotal.toString()).toBe('1500');
    });

    it('модификаторы прибавляются к КАЖДОЙ штуке, а не к строке', () => {
      const { lines } = calculateOrderItems(
        [{ menuItemId: 'i1', quantity: 2, optionIds: ['o30'] }],
        [item({ modifierGroups: [group()] })],
        NOW,
      );

      expect(lines[0].lineTotal.toString()).toBe('1200');
    });

    it('копейки складываются точно (за этим и нужен Decimal)', () => {
      const { itemsTotal } = calculateOrderItems(
        [
          { menuItemId: 'i1', quantity: 1, optionIds: [] },
          { menuItemId: 'i2', quantity: 1, optionIds: [] },
        ],
        [item({ price: d('0.1') }), item({ id: 'i2', price: d('0.2') })],
        NOW,
      );

      expect(itemsTotal.toString()).toBe('0.3');
    });

    it('итог = сумма строк', () => {
      const { itemsTotal } = calculateOrderItems(
        [
          { menuItemId: 'i1', quantity: 2, optionIds: [] },
          { menuItemId: 'i2', quantity: 1, optionIds: [] },
        ],
        [item(), item({ id: 'i2', name: 'Кола', price: d(120) })],
        NOW,
      );

      expect(itemsTotal.toString()).toBe('1120');
    });

    it('отрицательная доплата не уводит строку ниже нуля', () => {
      const { lines } = calculateOrderItems(
        [{ menuItemId: 'i1', quantity: 1, optionIds: ['minus'] }],
        [
          item({
            price: d(50),
            modifierGroups: [
              group({ options: [option('minus', 'без всего', -100)] }),
            ],
          }),
        ],
        NOW,
      );

      expect(lines[0].lineTotal.toString()).toBe('0');
    });
  });

  describe('цена — тем же правилом, что на витрине', () => {
    it('действующая скидка применяется', () => {
      const { lines } = calculateOrderItems(
        [{ menuItemId: 'i1', quantity: 1, optionIds: [] }],
        [
          item({
            discountPrice: d(399),
            discountUntil: new Date('2026-08-15T00:00:00Z'),
          }),
        ],
        NOW,
      );

      expect(lines[0].basePriceSnapshot.toString()).toBe('399');
    });

    it('истёкшая акция НЕ применяется — платим обычную цену', () => {
      const { lines } = calculateOrderItems(
        [{ menuItemId: 'i1', quantity: 1, optionIds: [] }],
        [
          item({
            discountPrice: d(399),
            discountUntil: new Date('2026-08-01T00:00:00Z'),
          }),
        ],
        NOW,
      );

      expect(lines[0].basePriceSnapshot.toString()).toBe('500');
    });
  });

  describe('снимки', () => {
    it('в строке лежат название и цена НА МОМЕНТ заказа', () => {
      const { lines } = calculateOrderItems(
        [{ menuItemId: 'i1', quantity: 1, optionIds: ['o30'] }],
        [item({ modifierGroups: [group()] })],
        NOW,
      );

      expect(lines[0].nameSnapshot).toBe('Маргарита');
      expect(lines[0].basePriceSnapshot.toString()).toBe('500');
      expect(lines[0].modifiers).toEqual([
        {
          groupNameSnapshot: 'Размер',
          optionNameSnapshot: '30 см',
          priceDeltaSnapshot: d(100),
        },
      ]);
    });

    it('модификаторы идут в порядке групп меню, а не в порядке запроса', () => {
      const menu = [
        item({
          modifierGroups: [
            group({ id: 'g1', name: 'Размер' }),
            group({
              id: 'g2',
              name: 'Добавки',
              type: ModifierType.MULTIPLE,
              options: [option('cheese', 'сыр', 50)],
            }),
          ],
        }),
      ];

      const { lines } = calculateOrderItems(
        [{ menuItemId: 'i1', quantity: 1, optionIds: ['cheese', 'o30'] }],
        menu,
        NOW,
      );

      expect(lines[0].modifiers.map((m) => m.optionNameSnapshot)).toEqual([
        '30 см',
        'сыр',
      ]);
    });
  });

  describe('склейка одинаковых строк', () => {
    it('две одинаковые позиции складываются в одну', () => {
      const { lines } = calculateOrderItems(
        [
          { menuItemId: 'i1', quantity: 1, optionIds: [] },
          { menuItemId: 'i1', quantity: 2, optionIds: [] },
        ],
        [item()],
        NOW,
      );

      expect(lines).toHaveLength(1);
      expect(lines[0].quantity).toBe(3);
    });

    it('склейка НЕ обходит лимит штук (найдено ревью Этапа 4)', () => {
      expect(() =>
        calculateOrderItems(
          [
            { menuItemId: 'i1', quantity: 30, optionIds: [] },
            { menuItemId: 'i1', quantity: 30, optionIds: [] },
          ],
          [item()],
          NOW,
        ),
      ).toThrow(/не больше 30 штук/);
    });

    it('тот же набор опций в другом порядке — это одна строка', () => {
      const menu = [
        item({
          modifierGroups: [
            group({
              type: ModifierType.MULTIPLE,
              options: [option('a', 'сыр', 50), option('b', 'бекон', 70)],
            }),
          ],
        }),
      ];

      const { lines } = calculateOrderItems(
        [
          { menuItemId: 'i1', quantity: 1, optionIds: ['a', 'b'] },
          { menuItemId: 'i1', quantity: 1, optionIds: ['b', 'a'] },
        ],
        menu,
        NOW,
      );

      expect(lines).toHaveLength(1);
      expect(lines[0].quantity).toBe(2);
    });

    it('разные наборы опций — разные строки', () => {
      const menu = [item({ modifierGroups: [group()] })];

      const { lines } = calculateOrderItems(
        [
          { menuItemId: 'i1', quantity: 1, optionIds: ['o30'] },
          { menuItemId: 'i1', quantity: 1, optionIds: ['o25'] },
        ],
        menu,
        NOW,
      );

      expect(lines).toHaveLength(2);
    });
  });

  describe('проверки блюда', () => {
    it('блюда нет в выдаче меню — MENU_ITEM_NOT_FOUND', () => {
      expect(() =>
        calculateOrderItems(
          [{ menuItemId: 'чужое', quantity: 1, optionIds: [] }],
          [item()],
          NOW,
        ),
      ).toThrow(MenuItemNotFoundError);
    });

    it('блюдо в стоп-листе — отказ с его названием', () => {
      expect(() =>
        calculateOrderItems(
          [{ menuItemId: 'i1', quantity: 1, optionIds: [] }],
          [item({ isAvailable: false })],
          NOW,
        ),
      ).toThrow(/Маргарита/);
      expect(() =>
        calculateOrderItems(
          [{ menuItemId: 'i1', quantity: 1, optionIds: [] }],
          [item({ isAvailable: false })],
          NOW,
        ),
      ).toThrow(MenuItemUnavailableError);
    });
  });

  describe('проверки модификаторов', () => {
    const withRequiredSize = () =>
      item({ modifierGroups: [group({ isRequired: true })] });

    it('обязательная группа без выбора — отказ', () => {
      expect(() =>
        calculateOrderItems(
          [{ menuItemId: 'i1', quantity: 1, optionIds: [] }],
          [withRequiredSize()],
          NOW,
        ),
      ).toThrow(InvalidModifiersError);
    });

    it('обязательная группа с выбором — проходит', () => {
      const { lines } = calculateOrderItems(
        [{ menuItemId: 'i1', quantity: 1, optionIds: ['o30'] }],
        [withRequiredSize()],
        NOW,
      );
      expect(lines[0].lineTotal.toString()).toBe('600');
    });

    it('два варианта в SINGLE-группе — отказ (нельзя быть и 25, и 30 см)', () => {
      expect(() =>
        calculateOrderItems(
          [{ menuItemId: 'i1', quantity: 1, optionIds: ['o30', 'o25'] }],
          [item({ modifierGroups: [group()] })],
          NOW,
        ),
      ).toThrow(InvalidModifiersError);
    });

    it('перебор по maxSelections в MULTIPLE — отказ', () => {
      const menu = [
        item({
          modifierGroups: [
            group({
              type: ModifierType.MULTIPLE,
              maxSelections: 1,
              options: [option('a', 'сыр', 50), option('b', 'бекон', 70)],
            }),
          ],
        }),
      ];

      expect(() =>
        calculateOrderItems(
          [{ menuItemId: 'i1', quantity: 1, optionIds: ['a', 'b'] }],
          menu,
          NOW,
        ),
      ).toThrow(/не больше 1/);
    });

    it('кончившаяся опция — отказ, а не молчаливый пропуск', () => {
      const menu = [
        item({
          modifierGroups: [
            group({ options: [option('o30', '30 см', 100, false)] }),
          ],
        }),
      ];

      expect(() =>
        calculateOrderItems(
          [{ menuItemId: 'i1', quantity: 1, optionIds: ['o30'] }],
          menu,
          NOW,
        ),
      ).toThrow(/30 см/);
    });

    it('опция от ДРУГОГО блюда — отказ (её цену мы не знаем)', () => {
      expect(() =>
        calculateOrderItems(
          [{ menuItemId: 'i1', quantity: 1, optionIds: ['чужая-опция'] }],
          [item({ modifierGroups: [group()] })],
          NOW,
        ),
      ).toThrow(InvalidModifiersError);
    });

    it('минимум у НЕобязательной группы спрашивается только при выборе', () => {
      const menu = [
        item({
          modifierGroups: [
            group({
              type: ModifierType.MULTIPLE,
              minSelections: 2,
              options: [option('a', 'сыр', 50), option('b', 'бекон', 70)],
            }),
          ],
        }),
      ];

      expect(
        calculateOrderItems(
          [{ menuItemId: 'i1', quantity: 1, optionIds: [] }],
          menu,
          NOW,
        ).lines,
      ).toHaveLength(1);

      expect(() =>
        calculateOrderItems(
          [{ menuItemId: 'i1', quantity: 1, optionIds: ['a'] }],
          menu,
          NOW,
        ),
      ).toThrow(/минимум 2/);
    });

    it('обязательная группа с minSelections=0 всё равно требует один вариант', () => {
      expect(() =>
        calculateOrderItems(
          [{ menuItemId: 'i1', quantity: 1, optionIds: [] }],
          [
            item({
              modifierGroups: [group({ isRequired: true, minSelections: 0 })],
            }),
          ],
          NOW,
        ),
      ).toThrow(/минимум 1/);
    });
  });
});
