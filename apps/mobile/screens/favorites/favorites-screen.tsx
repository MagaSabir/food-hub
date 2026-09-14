import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { CaretLeftIcon, HeartIcon } from 'phosphor-react-native';
import { mapRestaurantToCard, RestaurantCard } from '@/entities/restaurant';
import { SignInInvite } from '@/features/auth';
import { useSessionStore } from '@/entities/session';
import { FavoriteHeart, useFavorites } from '@/features/favorites';
import { QueryErrorState } from '@/shared/ui/query-error-state';
import { queryFailure } from '@/shared/lib/query-failure';

export function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const status = useSessionStore((state) => state.status);
  const favoritesQuery = useFavorites();
  const { data: favorites, isLoading, refetch } = favoritesQuery;
  const failure = queryFailure(favoritesQuery);

  if (status === 'unknown') return <View className="flex-1 bg-canvas" />;

  if (status !== 'authenticated') {
    return <SignInInvite note="Войдите, чтобы сохранять любимые заведения" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      {}
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-1">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Назад"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
        >
          <CaretLeftIcon size={24} color="#1D1D1F" weight="bold" />
        </Pressable>

        <Text className="text-[24px] font-bold text-ink">Избранное</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#49B85D" />
        </View>
      ) : failure ? (
        <QueryErrorState error={failure} onRetry={() => void refetch()} />
      ) : favorites && favorites.length > 0 ? (
        <ScrollView
          contentContainerStyle={{
            paddingTop: 12,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-3 px-5">
            {favorites.map((item) => (
              <RestaurantCard
                key={item.id}
                {...mapRestaurantToCard(item)}
                action={<FavoriteHeart restaurant={item} />}
                onPress={() =>
                  router.push({
                    pathname: '/restaurant/[slug]',
                    params: { slug: item.slug },
                  })
                }
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <HeartIcon size={40} color="#C7C7CC" weight="bold" />
          <Text className="mt-4 text-center text-[17px] font-bold text-ink">
            Пока пусто
          </Text>
          <Text className="mt-2 text-center text-[15px] leading-[22px] text-ink-secondary">
            Нажмите сердечко на карточке заведения — оно окажется здесь.
          </Text>
          {}
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
            className="mt-6 rounded-full bg-primary-500 px-6 py-3 active:bg-primary-700"
          >
            <Text className="text-[15px] font-semibold text-white">
              К заведениям
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
