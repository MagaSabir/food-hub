import { Animated, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';

/** Высота обложки. Знает и экран: от неё считается момент проявления подложки. */
export const COVER_HEIGHT = 280;

interface RestaurantCoverProps {
  coverUrl?: string | null;
  /** Позиция прокрутки экрана — из неё считаем «резиновое» растяжение фото. */
  scrollY?: Animated.Value;
  /** Сколько всего фото — для подсказки «N фото» в углу. */
  photosCount?: number;
  /** Тап по фото — открыть галерею. */
  onPress?: () => void;
}

/**
 * Обложка заведения — фото на всю ширину
 */
export function RestaurantCover({
  coverUrl,
  scrollY,
  photosCount = 0,
  onPress,
}: RestaurantCoverProps) {
  // Классическая «резиновая» шапка iOS. Тянешь экран вниз (scrollY уходит в
  // минус) — фото растёт ровно настолько, чтобы закрыть открывшуюся пустоту:
  // масштаб 1 + оттяжка/высота, подъём — половина оттяжки. Именно эта пара и
  // держит низ фото на месте, а верх — без белой щели при любой длине тяги.
  // Вниз (scrollY > 0) эффекта нет: extrapolateRight clamp.
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
      // Без фото открывать нечего — тогда и нажатие не нужно.
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

      {/* Подсказка, что фото можно открыть: счётчик в углу, как в маркетплейсах.
          Без него тап — скрытая функция, о которой никто не узнает. */}
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

/** Лого-бейдж заведения: белая плитка, заезжает на обложку (как в карточке каталога). */
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
      style={{
        shadowColor: '#000000',
        shadowOpacity: 0.16,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
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
