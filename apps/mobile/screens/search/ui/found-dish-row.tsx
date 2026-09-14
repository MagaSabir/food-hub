import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ForkKnifeIcon } from 'phosphor-react-native';
import type { SearchDishItem } from '@foodhubme/shared';
import { formatPrice } from '@/shared/lib/format-price';
import { surfaceShadow } from '@/shared/lib/surface';

interface FoundDishRowProps {
  dish: SearchDishItem;
  onPress: () => void;
}

export function FoundDishRow({ dish, onPress }: FoundDishRowProps) {
  const unavailable = !dish.isAvailable;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${dish.name}, ${dish.restaurant.name}, ${formatPrice(dish.price)}${
        unavailable ? ', сегодня недоступно' : ''
      }`}
      className="mb-2 flex-row items-center gap-3 rounded-2xl border border-hairline bg-white p-2 active:opacity-70"
      style={surfaceShadow}
    >
      <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-surface-2">
        {dish.photoUrl ? (
          <Image
            source={{ uri: dish.photoUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <ForkKnifeIcon size={22} color="#C7C7CC" />
        )}
      </View>

      <View className="flex-1 py-1">
        <Text
          className={`text-[15px] font-semibold ${unavailable ? 'text-ink-secondary' : 'text-ink'}`}
          numberOfLines={1}
        >
          {dish.name}
        </Text>

        <Text
          className="mt-0.5 text-[13px] text-ink-secondary"
          numberOfLines={1}
        >
          {dish.restaurant.name}
        </Text>

        <View className="mt-1 flex-row items-center gap-2">
          <Text className="text-[15px] font-bold text-ink">
            {formatPrice(dish.price)}
          </Text>

          {dish.oldPrice ? (
            <Text className="text-[13px] text-ink-secondary line-through">
              {formatPrice(dish.oldPrice)}
            </Text>
          ) : null}

          {}
          {unavailable ? (
            <Text className="text-[13px] text-ink-secondary">
              · сегодня нет
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
