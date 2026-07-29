import { create } from 'zustand';

export interface CartLine {
  dishId: string;
  name: string;
  /** Цена за штуку на момент добавления. Настоящий снимок цены сделает
   *  backend при оформлении (правило проекта) — этот нужен только для показа. */
  price: number;
  quantity: number;
}

interface CartState {
  /** Позиции по dishId — так добавление и изменение количества O(1). */
  lines: Record<string, CartLine>;
  addDish: (dish: { id: string; name: string; price: number }) => void;
  decreaseDish: (dishId: string) => void;
  clear: () => void;
}

/**
 * Корзина гостя — локальная, в памяти приложения (Zustand).
 * Пока в ней одно заведение: смена ресторана на Этапе 3/4 будет спрашивать
 * «очистить корзину?». Отправка на backend и снимки цен — Этап 4.
 */
export const useCartStore = create<CartState>((set) => ({
  lines: {},

  addDish: ({ id, name, price }) =>
    set((state) => {
      const existing = state.lines[id];
      return {
        lines: {
          ...state.lines,
          [id]: existing
            ? { ...existing, quantity: existing.quantity + 1 }
            : { dishId: id, name, price, quantity: 1 },
        },
      };
    }),

  decreaseDish: (dishId) =>
    set((state) => {
      const existing = state.lines[dishId];
      if (!existing) return state;

      // Последняя штука — убираем позицию целиком, а не оставляем нулевую.
      if (existing.quantity <= 1) {
        const { [dishId]: _removed, ...rest } = state.lines;
        return { lines: rest };
      }
      return {
        lines: {
          ...state.lines,
          [dishId]: { ...existing, quantity: existing.quantity - 1 },
        },
      };
    }),

  clear: () => set({ lines: {} }),
}));

/** Сколько всего штук в корзине (для бейджа и плашки). */
export function selectTotalCount(state: CartState): number {
  return Object.values(state.lines).reduce(
    (sum, line) => sum + line.quantity,
    0,
  );
}

/** Сумма к показу. Итоговую сумму заказа всё равно считает backend. */
export function selectTotalPrice(state: CartState): number {
  return Object.values(state.lines).reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );
}
