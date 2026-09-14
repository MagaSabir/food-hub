import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { logoBadgeShadow } from '@/shared/lib/surface';
import {
  ClockIcon,
  MapPinIcon,
  StorefrontIcon,
  LightningIcon,
  MopedIcon,
  StarIcon,
} from 'phosphor-react-native';
import type { DeliveryLabel } from '../lib/delivery-label';

export interface RestaurantCardProps {
  name: string;
  cuisine: string;
  rating: number;
  reviewsCount: number;
  deliveryTime: string;
  distanceLabel?: string | null;
  delivery: DeliveryLabel;
  isFastDelivery?: boolean;
  imageUrl?: string | null;
  logoUrl?: string | number | null;
  action?: ReactNode;
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

export function RestaurantCard({
  name,
  cuisine,
  rating,
  reviewsCount,
  deliveryTime,
  distanceLabel = null,
  delivery,
  isFastDelivery = false,
  imageUrl,
  logoUrl,
  action,
  onPress,
}: RestaurantCardProps) {
  const a11yLabel = [
    name,
    cuisine,
    reviewsCount > 0
      ? `рейтинг ${rating.toFixed(1)}, ${reviewsCount} отзывов`
      : 'нет отзывов',
    distanceLabel ?? deliveryTime,
    `доставка: ${delivery.short}`,
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
        {action ? (
          <View className="absolute right-2.5 top-2.5">{action}</View>
        ) : null}
        {isFastDelivery ? (
          <View className="absolute left-2.5 top-2.5 flex-row items-center gap-1 rounded-full bg-white/85 px-2 py-1">
            <LightningIcon size={12} color="#49B85D" weight="fill" />
            <Text className="text-[12px] font-semibold text-ink">
              Быстрая доставка
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row gap-4 px-3 pb-3">
        {}
        <View
          className="-mt-[37.5px] h-[75px] w-[75px] rounded-logo border border-hairline bg-white"
          style={logoBadgeShadow}
        >
          <View className="h-full w-full items-center justify-center overflow-hidden rounded-logo bg-white p-2">
            {logoUrl ? (
              <Image
                source={
                  typeof logoUrl === 'number' ? logoUrl : { uri: logoUrl }
                }
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            ) : (
              <Text className="text-[17px] font-extrabold text-ink">
                {initials(name)}
              </Text>
            )}
          </View>
        </View>

        <View className="flex-1 pt-2.5">
          {}
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
                  <StarIcon size={12} color="#FFB800" weight="fill" />
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

          {}
          <View className="mt-1.5 flex-row items-center gap-1">
            {distanceLabel ? (
              <MapPinIcon size={12} color="#6E6E73" />
            ) : (
              <ClockIcon size={12} color="#6E6E73" />
            )}
            <Text className="text-[12px] font-semibold text-ink-secondary">
              {distanceLabel ?? deliveryTime}
            </Text>
            <Text className="text-[12px] text-ink-placeholder">•</Text>
            {delivery.pickupOnly ? (
              <StorefrontIcon size={13} color="#6E6E73" />
            ) : (
              <MopedIcon
                size={13}
                color={delivery.accent ? '#49B85D' : '#6E6E73'}
              />
            )}
            <Text
              className={`shrink text-[12px] font-semibold ${
                delivery.accent ? 'text-primary-500' : 'text-ink'
              }`}
              numberOfLines={1}
            >
              {delivery.short}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
