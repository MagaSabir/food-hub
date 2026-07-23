import { ScrollView, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { CatalogHeader } from './ui/catalog-header';
import { CatalogSearch } from './ui/catalog-search';
import {
  MOCK_HAS_UNREAD,
  MOCK_LOCATION,
  MOCK_RESTAURANTS,
} from '@/screens/catalog/model/mocks';
import { useRef } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import { CuisineChips } from '@/screens/catalog/ui/cuisine-chips';
import { SectionHeader } from '@/screens/catalog/ui/section-header';
import { RestaurantCard } from '@/entities/restaurant';

export function CatalogScreen() {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 86 }}
        showsVerticalScrollIndicator={false}
      >
        <CatalogHeader
          city={MOCK_LOCATION.city}
          address={MOCK_LOCATION.address}
          hasUnreadNotifications={MOCK_HAS_UNREAD}
        />
        <CatalogSearch />
        <CuisineChips />
        <SectionHeader title="Рядом с вами" onSeeAll={() => {}} />
        <View className="gap-3 px-5 pt-2">
          {MOCK_RESTAURANTS.map((restaurant) => (
            <RestaurantCard key={restaurant.name} {...restaurant} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
