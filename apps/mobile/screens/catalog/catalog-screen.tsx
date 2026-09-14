import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { router } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { CatalogSort } from '@foodhubme/shared';
import {
  mapRestaurantToCard,
  RestaurantCard,
  useRestaurants,
} from '@/entities/restaurant';
import { AddressSheet, useAddressStore } from '@/features/address-input';
import { FavoriteHeart } from '@/features/favorites';
import { PILOT_CITY } from '@/shared/config/city';
import { queryFailure } from '@/shared/lib/query-failure';
import { tabBarContentPadding } from '@/shared/lib/tab-bar';
import { QueryErrorState } from '@/shared/ui/query-error-state';
import { CatalogHeader } from './ui/catalog-header';
import { CatalogSearch } from './ui/catalog-search';
import { CuisineChips } from './ui/cuisine-chips';
import { FiltersSheet } from './ui/filters-sheet';
import { PromoBanners } from './ui/promo-banners';
import { SectionHeader } from './ui/section-header';
import { MOCK_BANNERS, MOCK_HAS_UNREAD } from './model/mocks';
export function CatalogScreen() {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const insets = useSafeAreaInsets();

  const [sort, setSort] = useState<CatalogSort>(CatalogSort.NAME);
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const address = useAddressStore((state) => state.address);
  const setAddress = useAddressStore((state) => state.setAddress);

  const restaurantsQuery = useRestaurants({
    sort,
    cuisine: cuisine ?? undefined,
    open: onlyOpen || undefined,
    latitude: address?.latitude,
    longitude: address?.longitude,
  });

  const { data: restaurants, isLoading, refetch } = restaurantsQuery;
  const failure = queryFailure(restaurantsQuery);

  const isDefaultSort = sort === CatalogSort.NAME;
  const hasFilters = !isDefaultSort || cuisine !== null || onlyOpen;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !restaurants) return restaurants ?? [];
    return restaurants.filter((item) =>
      [item.name, ...item.cuisineTypes]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [restaurants, query]);

  const [delivering, pickupOnly] = useMemo(() => {
    const yes = visible.filter((item) => item.deliversToAddress !== false);
    const no = visible.filter((item) => item.deliversToAddress === false);
    return [yes, no];
  }, [visible]);

  const openRestaurant = (slug: string) =>
    router.push({ pathname: '/restaurant/[slug]', params: { slug } });

  const resetFilters = () => {
    setSort(CatalogSort.NAME);
    setCuisine(null);
    setOnlyOpen(false);
  };

  const isSettlementOnly =
    address !== null && address.address === address.locality;
  const addressLine = isSettlementOnly ? null : (address?.address ?? null);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      {}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: tabBarContentPadding(insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        <CatalogHeader
          city={address?.locality ?? PILOT_CITY.name}
          address={addressLine}
          addressPlaceholder={
            isSettlementOnly ? 'Уточните улицу и дом' : undefined
          }
          onPressAddress={() => setIsAddressOpen(true)}
          hasUnreadNotifications={MOCK_HAS_UNREAD}
        />
        <CatalogSearch
          value={query}
          onChange={setQuery}
          onOpenFilters={() => setIsFiltersOpen(true)}
          hasFilters={hasFilters}
        />
        <CuisineChips value={cuisine} onChange={setCuisine} />
        {}
        {hasFilters || query ? null : <PromoBanners banners={MOCK_BANNERS} />}
        {}
        {hasFilters || query ? (
          <SectionHeader title={`Найдено: ${visible.length}`} />
        ) : (
          <SectionHeader title="Рядом с вами" onSeeAll={() => {}} />
        )}

        {}
        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#49B85D" />
          </View>
        ) : failure ? (
          <QueryErrorState
            error={failure}
            onRetry={() => void refetch()}
            variant="inline"
          />
        ) : visible.length > 0 ? (
          <>
            <View className="gap-3 px-5 pt-2">
              {delivering.map((item) => (
                <RestaurantCard
                  key={item.id}
                  {...mapRestaurantToCard(item)}
                  action={<FavoriteHeart restaurant={item} />}
                  onPress={() => openRestaurant(item.slug)}
                />
              ))}
            </View>

            {pickupOnly.length > 0 ? (
              <>
                <SectionHeader title="Не возят по вашему адресу" />
                <Text className="px-5 pb-1 text-[13px] text-ink-secondary">
                  Сюда доставки нет, но заказ можно забрать самому.
                </Text>
                <View className="gap-3 px-5 pt-2">
                  {pickupOnly.map((item) => (
                    <RestaurantCard
                      key={item.id}
                      {...mapRestaurantToCard(item)}
                      action={<FavoriteHeart restaurant={item} />}
                      onPress={() => openRestaurant(item.slug)}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </>
        ) : (
          <View className="items-center gap-3 px-5 py-8">
            <Text className="text-center text-[14px] text-ink-secondary">
              {hasFilters || query
                ? 'Ничего не нашлось. Попробуйте изменить фильтры.'
                : 'Пока нет ресторанов'}
            </Text>
            {}
            {hasFilters || query ? (
              <Pressable
                onPress={() => {
                  resetFilters();
                  setQuery('');
                }}
                accessibilityRole="button"
                className="rounded-full bg-primary-500 px-5 py-2.5 active:bg-primary-700"
              >
                <Text className="text-[14px] font-semibold text-white">
                  Сбросить фильтры
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </ScrollView>

      <AddressSheet
        visible={isAddressOpen}
        current={address}
        onSave={setAddress}
        onClose={() => setIsAddressOpen(false)}
      />

      <FiltersSheet
        isVisible={isFiltersOpen}
        sort={sort}
        onlyOpen={onlyOpen}
        onChangeSort={setSort}
        onChangeOnlyOpen={setOnlyOpen}
        onReset={resetFilters}
        onClose={() => setIsFiltersOpen(false)}
      />
    </SafeAreaView>
  );
}
