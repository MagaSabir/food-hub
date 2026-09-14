import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RestaurantListItem } from '@foodhubme/shared';
import { apiFetch } from '@/shared/api/client';
import { FAVORITES_KEY } from './use-favorites';

interface ToggleInput {
  restaurant: RestaurantListItem;
  isFavorite: boolean;
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ restaurant, isFavorite }: ToggleInput) =>
      isFavorite
        ? apiFetch<void>(`/favorites/${restaurant.id}`, { method: 'DELETE' })
        : apiFetch<void>('/favorites', {
            method: 'POST',
            body: JSON.stringify({ restaurantId: restaurant.id }),
          }),

    onMutate: async ({ restaurant, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });

      const previous =
        queryClient.getQueryData<RestaurantListItem[]>(FAVORITES_KEY);

      queryClient.setQueryData<RestaurantListItem[]>(
        FAVORITES_KEY,
        (list = []) =>
          isFavorite
            ? list.filter((item) => item.id !== restaurant.id)
            : [restaurant, ...list],
      );

      return { previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_KEY, context.previous);
      }
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: FAVORITES_KEY }),
  });
}
