import { Pressable, Text, View } from 'react-native';
import { CaretRightIcon } from 'phosphor-react-native';
import type { OrderListItemView } from '@foodhubme/shared';
import {
  STATUS_TONE_CLASS,
  orderStatusView,
  orderTypeLabel,
} from '@/entities/order';
import { formatOrderDate } from '@/shared/lib/format-date';
import { formatPrice } from '@/shared/lib/format-price';

interface OrderRowProps {
  order: OrderListItemView;
  onPress: () => void;
}

function itemsLabel(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} товаров`;
  if (last === 1) return `${count} товар`;
  if (last >= 2 && last <= 4) return `${count} товара`;
  return `${count} товаров`;
}

export function OrderRow({ order, onPress }: OrderRowProps) {
  const status = orderStatusView(order.status, order.orderType);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Заказ №${order.orderNumber}, ${status.label}`}
      className="mb-3 flex-row items-center gap-3 rounded-[20px] bg-white p-4 active:opacity-70"
    >
      <View className="flex-1">
        <Text
          className={`text-[15px] font-semibold ${STATUS_TONE_CLASS[status.tone]}`}
        >
          {status.label}
        </Text>

        <Text
          className="mt-1 text-[17px] font-semibold text-ink"
          numberOfLines={1}
        >
          {order.restaurantName}
        </Text>

        <Text className="mt-1 text-[13px] text-ink-secondary">
          №{order.orderNumber} · {orderTypeLabel(order.orderType)} ·{' '}
          {itemsLabel(order.itemsCount)}
        </Text>

        <Text className="mt-1 text-[13px] text-ink-secondary">
          {formatOrderDate(order.createdAt)} · {formatPrice(order.total)}
        </Text>
      </View>

      <CaretRightIcon size={18} color="#A1A1A6" weight="bold" />
    </Pressable>
  );
}
