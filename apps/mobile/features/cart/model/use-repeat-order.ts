import { useMutation } from '@tanstack/react-query';
import type { RepeatOrderView } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';
import { useCartStore } from './cart-store';

export function useRepeatOrder() {
  const clear = useCartStore((state) => state.clear);
  const add = useCartStore((state) => state.add);

  return useMutation({
    mutationFn: (orderId: string) =>
      apiFetch<RepeatOrderView>(`/orders/${orderId}/repeat`),

    onSuccess: (plan) => {
      clear();

      const restaurant = {
        id: plan.restaurantId,
        slug: plan.restaurantSlug,
        name: plan.restaurantName,
      };

      for (const item of plan.items) {
        add({
          restaurant,
          dishId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          photoUrl: item.photoUrl,
          options: item.options.map((option) => ({
            id: option.id,
            name: option.name,
            groupName: option.groupName,
            priceDelta: option.priceDelta,
          })),
        });
      }
    },
  });
}
