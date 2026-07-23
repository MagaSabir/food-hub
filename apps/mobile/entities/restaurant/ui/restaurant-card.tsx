import { Pressable, View, Text } from 'react-native';
import { Image } from 'expo-image';
import {
  ClockIcon,
  LightningIcon,
  MopedIcon,
  StarIcon,
} from 'phosphor-react-native';

export interface RestaurantCardProps {
  name: string;
  cuisine: string; // «Итальянская • Пицца • Паста»
  rating: number;
  reviewsCount: number; // сколько отзывов — рядом с рейтингом: «4.8 (124)»
  deliveryTime: string; // «30–40 мин»
  deliveryFee: string; // «149 ₽»; показываем, когда нет freeDeliveryFrom
  freeDeliveryFrom?: string; // «500 ₽» → зелёное «Бесплатно от 500 ₽» (freeDeliveryMinOrder)
  isFastDelivery?: boolean; // плашка «⚡ Быстрая доставка» на фото
  imageUrl?: string | null; // фото-баннер
  logoUrl?: string | number | null; // URL с бэка, локальный require (в т.ч .svg) или null
  onPress?: () => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

const cardShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};

const logoShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.16,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 5 }, // тень уходит вниз, под бейдж
  elevation: 6,
};

export function RestaurantCard({
  name,
  cuisine,
  rating,
  reviewsCount,
  deliveryTime,
  deliveryFee,
  freeDeliveryFrom,
  isFastDelivery = false,
  imageUrl,
  logoUrl,
  onPress,
}: RestaurantCardProps) {
  // Единая подпись карточки для озвучки — иначе VoiceOver прочитает все внутренние
  // тексты вразнобой. Собираем в осмысленную фразу.
  const a11yLabel = [
    name,
    cuisine,
    reviewsCount > 0
      ? `рейтинг ${rating.toFixed(1)}, ${reviewsCount} отзывов`
      : 'нет отзывов',
    deliveryTime,
    freeDeliveryFrom
      ? `бесплатная доставка от ${freeDeliveryFrom}`
      : `доставка ${deliveryFee}`,
  ].join('. ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      className="rounded-3xl bg-white active:opacity-95"
      style={cardShadow}
    >
      <View className="h-[104px] overflow-hidden rounded-t-3xl bg-neutral-200">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : null}
        {isFastDelivery ? (
          <View className="absolute left-2.5 top-2.5 flex-row items-center gap-1 rounded-full bg-white/70 px-2 py-1">
            <LightningIcon size={12} color="#49B85D" weight="fill" />
            <Text className="text-[12px] font-semibold text-ink">
              Быстрая доставка
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row gap-4 px-3 pb-3">
        <View
          className="-mt-[37.5px] h-[75px] w-[75px] rounded-logo border border-hairline bg-white"
          style={logoShadow}
        >
          <View className="h-full w-full items-center justify-center overflow-hidden rounded-logo bg-white p-2">
            {logoUrl ? (
              <Image
                // Локальный ассет (require → число) отдаём как есть, URL — как {uri}.
                source={
                  typeof logoUrl === 'number' ? logoUrl : { uri: logoUrl }
                }
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            ) : (
              <Text className="text-[27px] font-extrabold text-ink">
                {initials(name)}
              </Text>
            )}
          </View>
        </View>

        <View className="flex-1 pt-2.5">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text
                className="text-[16px] font-bold text-ink"
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text
                className="mt-0.5 text-[12px] text-ink-secondary"
                numberOfLines={1}
              >
                {cuisine}
              </Text>
            </View>
            {reviewsCount > 0 ? (
              <View className="items-end">
                <View className="flex-row items-center gap-1">
                  <StarIcon size={12} color="#49B85D" weight="fill" />
                  <Text className="text-[12px] font-semibold text-ink">
                    {rating.toFixed(1)}
                  </Text>
                </View>
                <Text className="mt-0.5 text-[12px] text-ink-secondary">
                  ({reviewsCount})
                </Text>
              </View>
            ) : (
              <Text className="text-[12px] text-ink-secondary">
                Нет отзывов
              </Text>
            )}
          </View>

          <View className="mt-1.5 flex-row items-center gap-1">
            <ClockIcon size={12} color="#6E6E73" />
            <Text className="text-[12px] font-semibold text-ink-secondary">
              {deliveryTime}
            </Text>
            <Text className="text-[12px] text-ink-placeholder">•</Text>
            <MopedIcon
              size={13}
              color={freeDeliveryFrom ? '#49B85D' : '#6E6E73'}
            />
            {freeDeliveryFrom ? (
              <Text className="shrink text-[12px] font-semibold text-primary-500">
                Бесплатно от {freeDeliveryFrom}
              </Text>
            ) : (
              <Text
                className="shrink text-[12px] font-semibold text-ink"
                numberOfLines={1}
              >
                {deliveryFee}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
