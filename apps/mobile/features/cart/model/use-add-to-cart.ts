import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useCartStore, type AddToCartInput } from './cart-store';

export function useAddToCart() {
  const add = useCartStore((state) => state.add);
  const clear = useCartStore((state) => state.clear);

  return useCallback(
    (input: AddToCartInput) => {
      const current = useCartStore.getState().restaurant;

      if (!current || current.id === input.restaurant.id) {
        add(input);
        return;
      }

      Alert.alert(
        'Начать новую корзину?',
        `В корзине блюда из «${current.name}». Заказ собирают на одной кухне, ` +
          `поэтому добавить блюдо из «${input.restaurant.name}» можно только в новую корзину.`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Очистить и добавить',
            style: 'destructive',
            onPress: () => {
              clear();
              add(input);
            },
          },
        ],
      );
    },
    [add, clear],
  );
}
