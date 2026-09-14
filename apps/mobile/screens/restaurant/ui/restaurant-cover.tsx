import { Animated, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { logoBadgeShadow } from '@/shared/lib/surface';

export const COVER_HEIGHT = 280;

interface RestaurantCoverProps {
  coverUrl?: string | null;
  scrollY?: Animated.Value;
  photosCount?: number;
  onPress?: () => void;
}

export function RestaurantCover({
  coverUrl,
  scrollY,
  photosCount = 0,
  onPress,
}: RestaurantCoverProps) {
  const stretch = scrollY
    ? {
        transform: [
          {
            translateY: scrollY.interpolate({
              inputRange: [-COVER_HEIGHT, 0],
              outputRange: [-COVER_HEIGHT / 2, 0],
              extrapolateRight: 'clamp' as const,
            }),
          },
          {
            scale: scrollY.interpolate({
              inputRange: [-COVER_HEIGHT, 0],
              outputRange: [2, 1],
              extrapolateRight: 'clamp' as const,
            }),
          },
        ],
      }
    : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={!coverUrl || !onPress}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel="Фото заведения"
      accessibilityHint={onPress ? 'Открыть галерею' : undefined}
      style={{ height: COVER_HEIGHT }}
      className="bg-surface-2"
    >
      {coverUrl ? (
        <Animated.View style={[{ height: '100%', width: '100%' }, stretch]}>
          <Image
            source={{ uri: coverUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </Animated.View>
      ) : null}

      {}
      {photosCount > 1 ? (
        <View className="absolute bottom-9 right-4 rounded-full bg-black/55 px-2.5 py-1">
          <Text className="text-[12px] font-semibold text-white">
            {photosCount} фото
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function RestaurantLogo({
  name,
  logo,
}: {
  name: string;
  logo?: string | number | null;
}) {
  return (
    <View
      className="h-28 w-28 rounded-[24px] border border-hairline bg-white"
      style={logoBadgeShadow}
    >
      <View className="h-full w-full items-center justify-center overflow-hidden rounded-[24px] bg-white p-3">
        {logo ? (
          <Image
            source={typeof logo === 'number' ? logo : { uri: logo }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        ) : (
          <Text className="text-[20px] font-extrabold text-ink">
            {name.slice(0, 2).toUpperCase()}
          </Text>
        )}
      </View>
    </View>
  );
}
