import { create } from 'zustand';

export interface CartLineOption {
  id: string;
  name: string;
  priceDelta: number;
  groupName: string;
}

export interface CartLine {
  id: string;
  dishId: string;
  name: string;
  price: number;
  options: CartLineOption[];
  quantity: number;
  photoUrl?: string | null;
  addedAt: number;
}

export interface CartRestaurant {
  id: string;
  slug: string;
  name: string;
}

export interface AddToCartInput {
  restaurant: CartRestaurant;
  dishId: string;
  name: string;
  price: number;
  options?: CartLineOption[];
  photoUrl?: string | null;
  quantity?: number;
}

export function makeLineId(
  dishId: string,
  options: CartLineOption[] = [],
): string {
  if (options.length === 0) return dishId;
  const ids = options.map((o) => o.id).sort();
  return `${dishId}::${ids.join(',')}`;
}

interface CartState {
  restaurant: CartRestaurant | null;
  lines: Record<string, CartLine>;
  add: (input: AddToCartInput) => void;
  increaseLine: (lineId: string) => void;
  decreaseLine: (lineId: string) => void;
  decreaseDish: (dishId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  restaurant: null,
  lines: {},

  add: ({
    restaurant,
    dishId,
    name,
    price,
    options = [],
    photoUrl,
    quantity = 1,
  }) =>
    set((state) => {
      const id = makeLineId(dishId, options);
      const existing = state.lines[id];

      return {
        restaurant: state.restaurant ?? restaurant,
        lines: {
          ...state.lines,
          [id]: existing
            ? { ...existing, quantity: existing.quantity + quantity }
            : {
                id,
                dishId,
                name,
                price,
                options,
                quantity,
                photoUrl,
                addedAt: Date.now(),
              },
        },
      };
    }),

  increaseLine: (lineId) =>
    set((state) => {
      const existing = state.lines[lineId];
      if (!existing) return state;
      return {
        lines: {
          ...state.lines,
          [lineId]: { ...existing, quantity: existing.quantity + 1 },
        },
      };
    }),

  decreaseLine: (lineId) =>
    set((state) => {
      const existing = state.lines[lineId];
      if (!existing) return state;

      if (existing.quantity <= 1) {
        const { [lineId]: _removed, ...rest } = state.lines;
        const isEmpty = Object.keys(rest).length === 0;
        return { lines: rest, restaurant: isEmpty ? null : state.restaurant };
      }
      return {
        lines: {
          ...state.lines,
          [lineId]: { ...existing, quantity: existing.quantity - 1 },
        },
      };
    }),

  decreaseDish: (dishId) => {
    const lines = Object.values(get().lines).filter(
      (line) => line.dishId === dishId,
    );
    if (lines.length === 0) return;

    const latest = lines.reduce((a, b) => (b.addedAt >= a.addedAt ? b : a));
    get().decreaseLine(latest.id);
  },

  clear: () => set({ lines: {}, restaurant: null }),
}));

export function selectTotalCount(state: CartState): number {
  return Object.values(state.lines).reduce(
    (sum, line) => sum + line.quantity,
    0,
  );
}

export function selectTotalPrice(state: CartState): number {
  return Object.values(state.lines).reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );
}

export function selectDishCount(state: CartState, dishId: string): number {
  return Object.values(state.lines).reduce(
    (sum, line) => (line.dishId === dishId ? sum + line.quantity : sum),
    0,
  );
}
