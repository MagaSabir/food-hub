import { RepeatSkipReason } from '@foodhubme/shared';
import { planRepeat, type CurrentDish, type OrderedLine } from './repeat-order';

const dish = (over: Partial<CurrentDish> = {}): CurrentDish => ({
  id: 'dish-1',
  name: 'Маргарита',
  photoUrl: 'https://cdn/1.jpg',
  price: 590,
  isAvailable: true,
  groups: [
    {
      name: 'Размер',
      options: [
        { id: 'opt-25', name: '25 см', priceDelta: 0 },
        { id: 'opt-30', name: '30 см', priceDelta: 150 },
      ],
    },
  ],
  ...over,
});

const line = (over: Partial<OrderedLine> = {}): OrderedLine => ({
  menuItemId: 'dish-1',
  name: 'Маргарита',
  quantity: 2,
  modifiers: [],
  ...over,
});

const menuOf = (...dishes: CurrentDish[]) =>
  new Map(dishes.map((d) => [d.id, d]));

describe('planRepeat', () => {
  describe('цены берём СЕГОДНЯШНИЕ', () => {
    it('блюдо подорожало — в корзину уедет новая цена', () => {
      const plan = planRepeat([line()], menuOf(dish({ price: 690 })));

      expect(plan.items[0].price).toBe(690);
      expect(plan.items[0].quantity).toBe(2);
    });

    it('доплата за модификатор тоже сегодняшняя', () => {
      const plan = planRepeat(
        [line({ modifiers: [{ groupName: 'Размер', optionName: '30 см' }] })],
        menuOf(
          dish({
            groups: [
              {
                name: 'Размер',
                options: [{ id: 'opt-30', name: '30 см', priceDelta: 200 }],
              },
            ],
          }),
        ),
      );

      expect(plan.items[0].price).toBe(790);
      expect(plan.items[0].options).toEqual([
        { id: 'opt-30', name: '30 см', groupName: 'Размер', priceDelta: 200 },
      ]);
    });

    it('имя тоже сегодняшнее — ресторан мог поправить опечатку', () => {
      const plan = planRepeat(
        [line({ name: 'Маргарита ' })],
        menuOf(dish({ name: 'Маргарита' })),
      );

      expect(plan.items[0].name).toBe('Маргарита');
    });
  });

  describe('чего повторить нельзя', () => {
    it('блюда нет в меню → REMOVED', () => {
      const plan = planRepeat([line()], menuOf());

      expect(plan.items).toHaveLength(0);
      expect(plan.skipped).toEqual([
        { name: 'Маргарита', reason: RepeatSkipReason.REMOVED },
      ]);
    });

    it('в чеке нет ссылки на меню (блюдо удалили давно) → REMOVED', () => {
      const plan = planRepeat([line({ menuItemId: null })], menuOf(dish()));

      expect(plan.skipped[0].reason).toBe(RepeatSkipReason.REMOVED);
    });

    it('стоп-лист → UNAVAILABLE, а не REMOVED', () => {
      const plan = planRepeat([line()], menuOf(dish({ isAvailable: false })));

      expect(plan.skipped[0].reason).toBe(RepeatSkipReason.UNAVAILABLE);
    });

    it('опции из чека больше нет → CHANGED', () => {
      const plan = planRepeat(
        [line({ modifiers: [{ groupName: 'Размер', optionName: '40 см' }] })],
        menuOf(dish()),
      );

      expect(plan.skipped[0].reason).toBe(RepeatSkipReason.CHANGED);
    });

    it('опция ищется в СВОЕЙ группе, а не по всему блюду', () => {
      const plan = planRepeat(
        [line({ modifiers: [{ groupName: 'Острота', optionName: '30 см' }] })],
        menuOf(dish()),
      );

      expect(plan.skipped[0].reason).toBe(RepeatSkipReason.CHANGED);
    });
  });

  it('часть повторяется, часть нет — и то и другое видно', () => {
    const plan = planRepeat(
      [line(), line({ menuItemId: 'dish-2', name: 'Пепперони' })],
      menuOf(dish()),
    );

    expect(plan.items).toHaveLength(1);
    expect(plan.skipped).toEqual([
      { name: 'Пепперони', reason: RepeatSkipReason.REMOVED },
    ]);
  });

  it('пустой заказ не ломает правило', () => {
    expect(planRepeat([], menuOf())).toEqual({ items: [], skipped: [] });
  });
});
