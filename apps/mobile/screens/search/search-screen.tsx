import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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
import { MagnifyingGlassIcon, SmileySadIcon } from 'phosphor-react-native';
import {
  SEARCH_MIN_QUERY_LENGTH,
  type SearchDishItem,
} from '@foodhubme/shared';
import { mapRestaurantToCard, RestaurantCard } from '@/entities/restaurant';
import {
  isSearchable,
  SearchField,
  useSearch,
  useSearchHistoryStore,
} from '@/features/search';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { tabBarContentPadding } from '@/shared/lib/tab-bar';
import { describeError } from '@/shared/lib/describe-error';
import { queryFailure } from '@/shared/lib/query-failure';
import { FoundDishRow } from './ui/found-dish-row';
import { SearchHistoryList } from './ui/search-history-list';
import { SearchMessage } from './ui/search-message';

export function SearchScreen() {
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);

  const history = useSearchHistoryStore((state) => state.queries);
  const isHistoryLoaded = useSearchHistoryStore((state) => state.isLoaded);
  const loadHistory = useSearchHistoryStore((state) => state.load);
  const remember = useSearchHistoryStore((state) => state.remember);
  const forget = useSearchHistoryStore((state) => state.forget);
  const clearHistory = useSearchHistoryStore((state) => state.clear);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const searchQuery = useSearch(debounced);
  const { data, isLoading, refetch } = searchQuery;
  const failure = queryFailure(searchQuery);

  const openRestaurant = (slug: string, dishId?: string) => {
    remember(query);

    router.push({
      pathname: '/restaurant/[slug]',
      params: dishId ? { slug, dish: dishId } : { slug },
    });
  };

  const openDish = (dish: SearchDishItem) =>
    openRestaurant(dish.restaurant.slug, dish.id);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <Text className="px-4 pb-2 pt-1 text-[24px] font-bold text-ink">
        Поиск
      </Text>

      <SearchField
        value={query}
        onChange={setQuery}
        onSubmit={() => isSearchable(query) && remember(query)}
      />

      {}
      <Pressable
        accessible={false}
        className="flex-1"
        onPress={() => Keyboard.dismiss()}
      >
        {renderBody()}
      </Pressable>
    </SafeAreaView>
  );

  function renderBody() {
    if (!isSearchable(debounced)) {
      if (!isHistoryLoaded) return <View className="flex-1" />;

      if (history.length > 0) {
        return (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{
              paddingBottom: tabBarContentPadding(insets.bottom),
            }}
          >
            <SearchHistoryList
              queries={history}
              onPick={setQuery}
              onForget={forget}
              onClear={clearHistory}
            />
          </ScrollView>
        );
      }

      return (
        <SearchMessage
          icon={<MagnifyingGlassIcon size={40} color="#C7C7CC" weight="bold" />}
          title="Что ищем?"
          note={`Название блюда или заведения — от ${SEARCH_MIN_QUERY_LENGTH} букв. Ищем сразу по всем меню: «шаурма» найдёт и блюдо, и заведение.`}
        />
      );
    }

    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center pb-24">
          <ActivityIndicator color="#49B85D" />
        </View>
      );
    }

    if (failure) {
      const { title, note, canRetry } = describeError(failure);

      return (
        <SearchMessage
          icon={<SmileySadIcon size={40} color="#C7C7CC" weight="bold" />}
          title={title}
          note={note}
          action={
            canRetry
              ? { label: 'Повторить', onPress: () => void refetch() }
              : undefined
          }
        />
      );
    }

    const restaurants = data?.restaurants ?? [];
    const dishes = data?.dishes ?? [];

    if (restaurants.length === 0 && dishes.length === 0) {
      return (
        <SearchMessage
          icon={<SmileySadIcon size={40} color="#C7C7CC" weight="bold" />}
          title={`Ничего не нашлось`}
          note={`По запросу «${debounced}» пусто. Попробуйте короче или другими словами — например, «шаурма» вместо «шаурма с курицей».`}
        />
      );
    }

    return (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingBottom: tabBarContentPadding(insets.bottom),
        }}
      >
        {}
        {restaurants.length > 0 ? (
          <View className="px-4 pt-2">
            <SectionTitle title="Заведения" count={restaurants.length} />

            {restaurants.map((item) => (
              <View key={item.id} className="mb-3">
                <RestaurantCard
                  {...mapRestaurantToCard(item)}
                  onPress={() => openRestaurant(item.slug)}
                />
              </View>
            ))}
          </View>
        ) : null}

        {dishes.length > 0 ? (
          <View className="px-4 pt-2">
            <SectionTitle title="Блюда" count={dishes.length} />

            {dishes.map((dish) => (
              <FoundDishRow
                key={dish.id}
                dish={dish}
                onPress={() => openDish(dish)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    );
  }
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <View className="mb-2 flex-row items-baseline gap-2">
      <Text className="text-[17px] font-bold text-ink">{title}</Text>
      <Text className="text-[13px] text-ink-secondary">{count}</Text>
    </View>
  );
}
