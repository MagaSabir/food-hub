import { useState } from 'react';
import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';

const bannerShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

const BANNER_ASPECT_RATIO = 3.1;

export interface PromoBannerData {
  id: string;
  image: number | { uri: string };
  linkUrl?: string;
  alt?: string;
}

interface PromoBannersProps {
  banners: PromoBannerData[];
  onPressBanner?: (banner: PromoBannerData) => void;
}

export function PromoBanners({ banners, onPressBanner }: PromoBannersProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  if (banners.length === 0) return null;

  return (
    <View className="pt-2 pb-1">
      <FlatList
        data={banners}
        keyExtractor={(banner) => banner.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / width);
          if (next !== activeIndex) setActiveIndex(next);
        }}
        renderItem={({ item }) => (
          <View style={{ width }} className="px-5">
            <View className="rounded-3xl bg-white" style={bannerShadow}>
              <Pressable
                onPress={() => onPressBanner?.(item)}
                accessibilityRole="button"
                accessibilityLabel={item.alt ?? 'Промо-акция'}
                className="overflow-hidden rounded-3xl active:opacity-90"
              >
                <Image
                  source={item.image}
                  style={{ width: '100%', aspectRatio: BANNER_ASPECT_RATIO }}
                  contentFit="cover"
                />
              </Pressable>
            </View>
          </View>
        )}
      />

      {}
      {banners.length > 1 ? (
        <View className="mt-2 flex-row items-center justify-center gap-1.5">
          {banners.map((banner, i) => (
            <View
              key={banner.id}
              className={`h-1.5 rounded-full ${
                i === activeIndex ? 'w-4 bg-primary-500' : 'w-1.5 bg-hairline'
              }`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
