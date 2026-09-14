import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MinusIcon, PlusIcon, TrashIcon } from 'phosphor-react-native';
import type { CartLine } from '@/features/cart';
import { formatPrice } from '@/shared/lib/format-price';

interface CartLineRowProps {
  line: CartLine;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function CartLineRow({
  line,
  onIncrease,
  onDecrease,
}: CartLineRowProps) {
  const options = line.options.map((option) => option.name).join(', ');
  const isLast = line.quantity <= 1;

  return (
    <View className="flex-row items-center gap-3 border-b border-hairline py-3">
      <View className="h-[68px] w-[68px] overflow-hidden rounded-2xl bg-surface-2">
        {line.photoUrl ? (
          <Image
            source={{ uri: line.photoUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : null}
      </View>

      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-ink" numberOfLines={2}>
          {line.name}
        </Text>
        {options ? (
          <Text
            className="mt-0.5 text-[12px] text-ink-secondary"
            numberOfLines={2}
          >
            {options}
          </Text>
        ) : null}
        <Text className="mt-1 text-[15px] font-bold text-ink">
          {formatPrice(line.price * line.quantity)}
        </Text>
      </View>

      <View className="h-9 flex-row items-center rounded-full bg-surface-2">
        <Pressable
          onPress={onDecrease}
          accessibilityRole="button"
          accessibilityLabel={isLast ? `Убрать «${line.name}»` : 'Меньше'}
          className="h-9 w-10 items-center justify-center rounded-l-full active:opacity-60"
        >
          {isLast ? (
            <TrashIcon size={16} color="#FF3B30" />
          ) : (
            <MinusIcon size={16} color="#1D1D1F" weight="bold" />
          )}
        </Pressable>
        <Text className="min-w-5 text-center text-[15px] font-bold text-ink">
          {line.quantity}
        </Text>
        <Pressable
          onPress={onIncrease}
          accessibilityRole="button"
          accessibilityLabel="Больше"
          className="h-9 w-10 items-center justify-center rounded-r-full active:opacity-60"
        >
          <PlusIcon size={16} color="#1D1D1F" weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}
