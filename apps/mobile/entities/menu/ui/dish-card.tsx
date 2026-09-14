import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import {
  FireIcon,
  LeafIcon,
  MinusIcon,
  PlusIcon,
  StarIcon,
} from 'phosphor-react-native';
import { formatPrice } from '@/shared/lib/format-price';

export type DishBadge = 'hit' | 'popular' | 'new';

export interface DishCardProps {
  id: string;
  name: string;
  composition: string;
  price: number;
  oldPrice?: number | null;
  imageUrl?: string | null;
  badge?: DishBadge;
  isAvailable?: boolean;
  quantity?: number;
  onPress?: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

const BADGES: Record<DishBadge, { label: string; icon: React.ReactNode }> = {
  hit: {
    label: 'Хит',
    icon: <FireIcon size={12} color="#FF6B35" weight="fill" />,
  },
  popular: {
    label: 'Популярно',
    icon: <StarIcon size={12} color="#FFB800" weight="fill" />,
  },
  new: {
    label: 'Новинка',
    icon: <LeafIcon size={12} color="#49B85D" weight="fill" />,
  },
};

const cardShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export function DishCard({
  name,
  composition,
  price,
  oldPrice,
  imageUrl,
  badge,
  isAvailable = true,
  quantity = 0,
  onPress,
  onAdd,
  onRemove,
}: DishCardProps) {
  const badgeData = badge ? BADGES[badge] : null;
  const priceLabel = formatPrice(price);
  const inCart = quantity > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        name,
        badgeData?.label,
        composition,
        priceLabel,
        inCart ? `в корзине ${quantity}` : null,
      ]
        .filter(Boolean)
        .join('. ')}
      className="flex-1 overflow-hidden rounded-2xl bg-white active:opacity-95"
      style={cardShadow}
    >
      <View className="h-[132px] bg-surface-2">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: '100%',
              height: '100%',
              opacity: isAvailable ? 1 : 0.4,
            }}
            contentFit="cover"
          />
        ) : null}

        {isAvailable ? null : (
          <View className="absolute inset-0 items-center justify-center">
            <Text className="rounded-full bg-black/65 px-3 py-1 text-[12px] font-semibold text-white">
              Нет в наличии
            </Text>
          </View>
        )}

        {badgeData ? (
          <View className="absolute left-2 top-2 flex-row items-center gap-1 rounded-full bg-black/65 px-2 py-1">
            {badgeData.icon}
            <Text className="text-[11px] font-semibold text-white">
              {badgeData.label}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="px-3 pb-3 pt-2.5">
        <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>
          {name}
        </Text>
        {}
        <Text
          className="mt-1 min-h-[36px] text-[12px] leading-[18px] text-ink-secondary"
          numberOfLines={2}
        >
          {composition}
        </Text>

        {}
        <View className="mt-2 h-11 flex-row items-center gap-2 pr-[72px]">
          <Text className="text-[17px] font-bold text-ink" numberOfLines={1}>
            {priceLabel}
          </Text>
          {}
          {oldPrice ? (
            <Text
              className="text-[13px] text-ink-secondary line-through"
              numberOfLines={1}
            >
              {formatPrice(oldPrice)}
            </Text>
          ) : null}
        </View>
      </View>

      {}
      {!isAvailable ? null : inCart ? (
        <View className="absolute bottom-0 right-0 h-11 flex-row items-center rounded-tl-2xl bg-primary-500">
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Убрать одну штуку «${name}»`}
            className="h-11 w-10 items-center justify-center rounded-tl-2xl active:bg-primary-700"
          >
            <MinusIcon size={18} color="#FFFFFF" weight="bold" />
          </Pressable>
          <Text className="min-w-5 text-center text-[15px] font-bold text-white">
            {quantity}
          </Text>
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={`Добавить ещё одну «${name}»`}
            className="h-11 w-10 items-center justify-center active:bg-primary-700"
          >
            <PlusIcon size={18} color="#FFFFFF" weight="bold" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={`Добавить «${name}» в корзину`}
          className="absolute bottom-0 right-0 h-11 w-14 items-center justify-center rounded-tl-2xl bg-primary-500 active:bg-primary-700"
        >
          <PlusIcon size={24} color="#FFFFFF" weight="bold" />
        </Pressable>
      )}
    </Pressable>
  );
}
