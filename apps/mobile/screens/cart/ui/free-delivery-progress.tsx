import { Text, View } from 'react-native';
import { MopedIcon } from 'phosphor-react-native';
import { formatPrice } from '@/shared/lib/format-price';

interface FreeDeliveryProgressProps {
  itemsTotal: number;
  amountToFreeDelivery: number;
}

export function FreeDeliveryProgress({
  itemsTotal,
  amountToFreeDelivery,
}: FreeDeliveryProgressProps) {
  const isFree = amountToFreeDelivery <= 0;
  const threshold = itemsTotal + amountToFreeDelivery;
  const ratio = isFree || threshold <= 0 ? 1 : itemsTotal / threshold;

  return (
    <View className="rounded-[20px] bg-primary-50 p-4">
      <View className="flex-row items-center gap-3">
        <MopedIcon size={24} color="#49B85D" weight="fill" />
        <Text className="flex-1 text-[15px] font-semibold text-ink">
          {isFree
            ? 'У вас бесплатная доставка'
            : `Добавьте ещё на ${formatPrice(amountToFreeDelivery)}`}
        </Text>
      </View>

      {!isFree ? (
        <View className="mt-3 flex-row items-center gap-3">
          <View className="h-2 flex-1 overflow-hidden rounded-full bg-white">
            <View
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
            />
          </View>
          <Text className="text-[13px] text-ink-secondary">
            {formatPrice(threshold)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
