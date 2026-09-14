import { Pressable, Text, View } from 'react-native';
import { CaretRightIcon, ShoppingBagIcon } from 'phosphor-react-native';

interface CartBarProps {
  count: number;
  total: string;
  onPress?: () => void;
}

function itemsWord(n: number): string {
  const tens = n % 100;
  const ones = n % 10;
  if (tens >= 11 && tens <= 14) return 'товаров';
  if (ones === 1) return 'товар';
  if (ones >= 2 && ones <= 4) return 'товара';
  return 'товаров';
}

export function CartBar({ count, total, onPress }: CartBarProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Корзина: ${count} ${itemsWord(count)} на ${total}. Перейти в корзину`}
      className="flex-row items-center rounded-[28px] bg-primary-500 px-3 py-2.5 active:bg-primary-600"
      style={{
        shadowColor: '#000000',
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
        <ShoppingBagIcon size={22} color="#49B85D" weight="fill" />
        {}
        <View className="absolute -right-1.5 -top-1.5 h-5 min-w-5 items-center justify-center rounded-full border border-primary-500 bg-white px-1">
          <Text className="text-[11px] font-bold text-primary-500">
            {count}
          </Text>
        </View>
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-[16px] font-bold text-white">Корзина</Text>
        <Text className="text-[12px] text-white/85">
          {count} {itemsWord(count)} на {total}
        </Text>
      </View>

      <View className="mx-2 h-8 w-px bg-white/25" />

      <View className="flex-row items-center gap-1 pr-1">
        <Text className="text-[15px] font-semibold text-white">
          Перейти в корзину
        </Text>
        <CaretRightIcon size={18} color="#FFFFFF" weight="bold" />
      </View>
    </Pressable>
  );
}
