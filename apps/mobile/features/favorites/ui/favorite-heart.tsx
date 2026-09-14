import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { HeartIcon } from 'phosphor-react-native';
import type { RestaurantListItem } from '@foodhubme/shared';
import { useSessionStore } from '@/entities/session';
import { useFavoriteIds } from '../api/use-favorites';
import { useToggleFavorite } from '../api/use-toggle-favorite';

interface FavoriteHeartProps {
  restaurant: RestaurantListItem;
}

export function FavoriteHeart({ restaurant }: FavoriteHeartProps) {
  const status = useSessionStore((state) => state.status);
  const favoriteIds = useFavoriteIds();
  const toggle = useToggleFavorite();

  const isFavorite = favoriteIds.has(restaurant.id);

  const press = () => {
    if (status !== 'authenticated') {
      router.push('/auth/phone');
      return;
    }

    toggle.mutate({ restaurant, isFavorite });
  };

  return (
    <Pressable
      onPress={press}
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite
          ? `Убрать из избранного: ${restaurant.name}`
          : `В избранное: ${restaurant.name}`
      }
      hitSlop={10}
      className="h-8 w-8 items-center justify-center rounded-full bg-white/90 active:opacity-70"
    >
      <HeartIcon
        size={18}
        color={isFavorite ? '#49B85D' : '#1D1D1F'}
        weight={isFavorite ? 'fill' : 'regular'}
      />
    </Pressable>
  );
}
