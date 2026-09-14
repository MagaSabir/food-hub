import { OrderStatus, OrderType } from '@foodhubme/shared';
import { orderStatusPush } from './order-push';

const order = (over: Partial<Parameters<typeof orderStatusPush>[0]> = {}) => ({
  orderNumber: 1043,
  type: OrderType.DELIVERY,
  status: OrderStatus.ACCEPTED,
  prepMinutes: 25,
  cancelReason: null,
  ...over,
});

describe('orderStatusPush', () => {
  describe('молчит там, где человека отвлекать нечем', () => {
    it.each([
      [OrderStatus.PENDING],
      [OrderStatus.PREPARING],
      [OrderStatus.COMPLETED],
    ])('%s', (status) => {
      expect(orderStatusPush(order({ status }))).toBeNull();
    });
  });

  describe('ACCEPTED — единственный ответ, которого ждут', () => {
    it('несёт время готовки в тексте', () => {
      expect(orderStatusPush(order())).toEqual({
        title: 'Заказ №1043 принят',
        body: 'Готовим — будет готов примерно через 25 минут',
      });
    });

    it('без времени готовки — без обещания', () => {
      const text = orderStatusPush(order({ prepMinutes: null }));

      expect(text?.body).toBe('Ресторан принял заказ и начал готовить');
    });

    it.each([
      [1, '1 минуту'],
      [2, '2 минуты'],
      [5, '5 минут'],
      [11, '11 минут'],
      [21, '21 минуту'],
      [22, '22 минуты'],
      [45, '45 минут'],
    ])('%i → «через %s»', (prepMinutes, expected) => {
      expect(orderStatusPush(order({ prepMinutes }))?.body).toContain(expected);
    });
  });

  describe('READY — бывает только у самовывоза и зала', () => {
    it('самовывоз: человеку есть что делать', () => {
      const text = orderStatusPush(
        order({ type: OrderType.PICKUP, status: OrderStatus.READY }),
      );

      expect(text).toEqual({
        title: 'Заказ №1043 готов',
        body: 'Можно забирать',
      });
    });

    it('в зале: делать ничего не нужно', () => {
      const text = orderStatusPush(
        order({ type: OrderType.DINE_IN, status: OrderStatus.READY }),
      );

      expect(text?.body).toBe('Сейчас принесут');
    });
  });

  it('ON_THE_WAY — заказ поехал', () => {
    const text = orderStatusPush(order({ status: OrderStatus.ON_THE_WAY }));

    expect(text).toEqual({
      title: 'Заказ №1043 в пути',
      body: 'Курьер выехал к вам',
    });
  });

  describe('CANCELLED — самое важное уведомление из всех', () => {
    it('несёт причину словами ресторана', () => {
      const text = orderStatusPush(
        order({
          status: OrderStatus.CANCELLED,
          cancelReason: 'Закончился лосось',
        }),
      );

      expect(text).toEqual({
        title: 'Заказ №1043 отклонён',
        body: 'Закончился лосось',
      });
    });

    it('без причины — нейтральный текст, а не пустая строка', () => {
      const text = orderStatusPush(order({ status: OrderStatus.CANCELLED }));

      expect(text?.body).toBe('Ресторан не смог принять заказ');
    });
  });
});
