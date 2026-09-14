import { ValidationPipe } from '@nestjs/common';
import { OrderType, PaymentMethod, ORDER_LIMITS } from '@foodhubme/shared';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { VALIDATION_PIPE_OPTIONS } from '../../../setup/pipes.setup';
import { CreateOrderInputDto } from './create-order.input-dto';

const parse = (body: Record<string, unknown>) => {
  const dto = plainToInstance(
    CreateOrderInputDto,
    body,
    VALIDATION_PIPE_OPTIONS.transformOptions,
  );
  return {
    dto,
    errors: validateSync(dto, {
      whitelist: VALIDATION_PIPE_OPTIONS.whitelist,
      stopAtFirstError: VALIDATION_PIPE_OPTIONS.stopAtFirstError,
    }),
  };
};

const throughPipe = (body: Record<string, unknown>): Promise<unknown> =>
  new ValidationPipe(VALIDATION_PIPE_OPTIONS).transform(body, {
    type: 'body',
    metatype: CreateOrderInputDto,
  }) as Promise<unknown>;

const failedFields = (errors: ReturnType<typeof validateSync>): string[] =>
  errors.flatMap((e) => [
    e.property,
    ...(e.children ?? []).flatMap((c) =>
      (c.children ?? []).length
        ? (c.children ?? []).map((g) => g.property)
        : [c.property],
    ),
  ]);

const RESTAURANT_ID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
const BRANCH_ID = '2f8a1c3e-5b7d-4a9f-8c1e-3d5b7a9f1c3e';
const ITEM_ID = '3f1a2b3c-4d5e-6f70-8901-234567890abc';
const OPTION_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const OPTION_ID_2 = '1e7c3b2a-9d4f-4a1b-8c5e-2f6a8b0d1c3e';

const delivery = {
  address: 'г. Грозный, пр. Путина, 12',
  latitude: 43.3169,
  longitude: 45.6981,
};

const validDeliveryBody = {
  restaurantId: RESTAURANT_ID,
  orderType: OrderType.DELIVERY,
  paymentMethod: PaymentMethod.CASH,
  items: [{ menuItemId: ITEM_ID, quantity: 2, optionIds: [OPTION_ID] }],
  delivery,
};

describe('CreateOrderInputDto', () => {
  describe('корректные заказы', () => {
    it('доставка с адресом и модификаторами проходит', () => {
      const { dto, errors } = parse(validDeliveryBody);
      expect(errors).toHaveLength(0);
      expect(dto.delivery?.latitude).toBe(43.3169);
      expect(dto.items[0].optionIds).toEqual([OPTION_ID]);
    });

    it('самовывоз с точкой и без адреса проходит', () => {
      const { errors } = parse({
        restaurantId: RESTAURANT_ID,
        branchId: BRANCH_ID,
        orderType: OrderType.PICKUP,
        paymentMethod: PaymentMethod.CASH,
        items: [{ menuItemId: ITEM_ID, quantity: 1 }],
      });
      expect(errors).toHaveLength(0);
    });

    it('в зале — как самовывоз, адрес не нужен', () => {
      const { errors } = parse({
        restaurantId: RESTAURANT_ID,
        branchId: BRANCH_ID,
        orderType: OrderType.DINE_IN,
        paymentMethod: PaymentMethod.CASH,
        items: [{ menuItemId: ITEM_ID, quantity: 1 }],
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('точка исполнения', () => {
    it('доставка БЕЗ branchId проходит: точку подбирает backend', () => {
      const { errors } = parse(validDeliveryBody);
      expect(errors).toHaveLength(0);
    });

    it('самовывоз без branchId — отказ: непонятно, куда человек приедет', () => {
      const { errors } = parse({
        restaurantId: RESTAURANT_ID,
        orderType: OrderType.PICKUP,
        paymentMethod: PaymentMethod.CASH,
        items: [{ menuItemId: ITEM_ID, quantity: 1 }],
      });
      expect(failedFields(errors)).toContain('branchId');
    });
  });

  describe('адрес доставки', () => {
    it('доставка без delivery — отказ: везти некуда', () => {
      const { errors } = parse({
        restaurantId: RESTAURANT_ID,
        orderType: OrderType.DELIVERY,
        paymentMethod: PaymentMethod.CASH,
        items: [{ menuItemId: ITEM_ID, quantity: 1 }],
      });
      expect(failedFields(errors)).toContain('delivery');
    });

    it('самовывоз С адресом — не ошибка, адрес просто не используется', () => {
      const { errors } = parse({
        restaurantId: RESTAURANT_ID,
        branchId: BRANCH_ID,
        orderType: OrderType.PICKUP,
        paymentMethod: PaymentMethod.CASH,
        items: [{ menuItemId: ITEM_ID, quantity: 1 }],
        delivery,
      });
      expect(errors).toHaveLength(0);
    });

    it('адрес из пробелов — отказ (пустая строка курьеру бесполезна)', () => {
      const { errors } = parse({
        ...validDeliveryBody,
        delivery: { ...delivery, address: '   ' },
      });
      expect(failedFields(errors)).toContain('address');
    });

    it('координаты за пределами Земли — отказ до всякого расчёта', () => {
      const { errors } = parse({
        ...validDeliveryBody,
        delivery: { ...delivery, latitude: 100 },
      });
      expect(failedFields(errors)).toContain('latitude');
    });

    it('координаты не числом — отказ (NaN уехал бы в расчёт цены)', () => {
      const { errors } = parse({
        ...validDeliveryBody,
        delivery: { ...delivery, longitude: 'где-то там' },
      });
      expect(failedFields(errors)).toContain('longitude');
    });
  });

  describe('позиции', () => {
    it('пустой заказ — отказ', () => {
      const { errors } = parse({ ...validDeliveryBody, items: [] });
      expect(failedFields(errors)).toContain('items');
    });

    it('позиций больше лимита — отказ', () => {
      const items = Array.from({ length: ORDER_LIMITS.MAX_LINES + 1 }, () => ({
        menuItemId: ITEM_ID,
        quantity: 1,
      }));
      const { errors } = parse({ ...validDeliveryBody, items });
      expect(failedFields(errors)).toContain('items');
    });

    it('id из сида и меню принимаются (проверяем ФОРМУ, а не версию uuid)', () => {
      const { errors } = parse({
        restaurantId: '22222222-0000-0000-0000-000000000001',
        branchId: '33333333-0000-0000-0000-000000000001',
        orderType: OrderType.PICKUP,
        paymentMethod: PaymentMethod.CASH,
        items: [
          {
            menuItemId: '87085618-b9f1-5dd9-897b-44ecf64f0f7a',
            quantity: 1,
            optionIds: ['0b0aada4-5113-5312-92fb-b1aaa4ed5d3d'],
          },
        ],
      });
      expect(errors).toHaveLength(0);
    });

    it('строка не в форме uuid — отказ', () => {
      const { errors } = parse({
        ...validDeliveryBody,
        items: [
          { menuItemId: '22222222-0000-0000-0000-00000000000', quantity: 1 },
        ],
      });
      expect(failedFields(errors)).toContain('menuItemId');
    });

    it('вложенные позиции РЕАЛЬНО проверяются (без @Type это тихая дыра)', () => {
      const { errors } = parse({
        ...validDeliveryBody,
        items: [{ menuItemId: 'не-uuid', quantity: 1 }],
      });
      expect(failedFields(errors)).toContain('menuItemId');
    });

    it('количество 0 — отказ', () => {
      const { errors } = parse({
        ...validDeliveryBody,
        items: [{ menuItemId: ITEM_ID, quantity: 0 }],
      });
      expect(failedFields(errors)).toContain('quantity');
    });

    it('количество дробное — отказ', () => {
      const { errors } = parse({
        ...validDeliveryBody,
        items: [{ menuItemId: ITEM_ID, quantity: 1.5 }],
      });
      expect(failedFields(errors)).toContain('quantity');
    });

    it('количество выше лимита — отказ', () => {
      const { errors } = parse({
        ...validDeliveryBody,
        items: [
          {
            menuItemId: ITEM_ID,
            quantity: ORDER_LIMITS.MAX_QUANTITY_PER_LINE + 1,
          },
        ],
      });
      expect(failedFields(errors)).toContain('quantity');
    });

    it('повторяющиеся опции — отказ (иначе «до 3 соусов» обходится дублем)', () => {
      const { errors } = parse({
        ...validDeliveryBody,
        items: [
          {
            menuItemId: ITEM_ID,
            quantity: 1,
            optionIds: [OPTION_ID, OPTION_ID],
          },
        ],
      });
      expect(failedFields(errors)).toContain('optionIds');
    });

    it('две разные опции — норма', () => {
      const { errors } = parse({
        ...validDeliveryBody,
        items: [
          {
            menuItemId: ITEM_ID,
            quantity: 1,
            optionIds: [OPTION_ID, OPTION_ID_2],
          },
        ],
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('прочее', () => {
    it('телефон нормализуется: 8… становится +7…', () => {
      const { dto, errors } = parse({
        ...validDeliveryBody,
        contactPhone: '8 (928) 000-00-00',
      });
      expect(errors).toHaveLength(0);
      expect(dto.contactPhone).toBe('+79280000000');
    });

    it('телефон не прислали — не ошибка (возьмём из профиля)', () => {
      const { errors } = parse(validDeliveryBody);
      expect(errors).toHaveLength(0);
    });

    it('неизвестный тип заказа — отказ', () => {
      const { errors } = parse({ ...validDeliveryBody, orderType: 'TAKEAWAY' });
      expect(failedFields(errors)).toContain('orderType');
    });

    it('комментарий длиннее лимита — отказ', () => {
      const { errors } = parse({
        ...validDeliveryBody,
        comment: 'а'.repeat(ORDER_LIMITS.MAX_COMMENT_LENGTH + 1),
      });
      expect(failedFields(errors)).toContain('comment');
    });

    it('присланные клиентом цены НЕ доезжают до логики (пайп их срезает)', async () => {
      const dto = (await throughPipe({
        ...validDeliveryBody,
        total: 1,
        items: [{ menuItemId: ITEM_ID, quantity: 1, price: 1 }],
      })) as CreateOrderInputDto;

      expect(dto).not.toHaveProperty('total');
      expect(dto.items[0]).not.toHaveProperty('price');
    });
  });
});
