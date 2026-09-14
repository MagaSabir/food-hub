import { ActivityIndicator, Text, View } from 'react-native';
import { OrderType, type DeliveryQuote } from '@foodhubme/shared';
import { formatPrice } from '@/shared/lib/format-price';

interface CartSummaryProps {
  quote: DeliveryQuote | undefined;
  orderType: OrderType;
  localTotal: number;
  isLoading: boolean;
}

export function CartSummary({
  quote,
  orderType,
  localTotal,
  isLoading,
}: CartSummaryProps) {
  const itemsTotal = quote?.itemsTotal ?? localTotal;
  const total = quote?.total ?? localTotal;
  const showDelivery = orderType === OrderType.DELIVERY && quote !== undefined;

  return (
    <View className="px-4 pt-4">
      <View className="flex-row justify-between">
        <Text className="text-[15px] text-ink-secondary">Товары</Text>
        <Text className="text-[15px] text-ink">{formatPrice(itemsTotal)}</Text>
      </View>

      {showDelivery ? (
        <View className="mt-2 flex-row justify-between">
          <Text className="text-[15px] text-ink-secondary">Доставка</Text>
          <Text
            className={`text-[15px] ${
              quote.isDeliveryFree ? 'text-primary-600' : 'text-ink'
            }`}
          >
            {quote.isDeliveryFree
              ? 'Бесплатно'
              : formatPrice(quote.deliveryFee)}
          </Text>
        </View>
      ) : null}

      <View className="mt-3 flex-row items-center justify-between border-t border-hairline pt-3">
        <Text className="text-[17px] font-bold text-ink">Итого</Text>
        <View className="flex-row items-center gap-2">
          {}
          {isLoading ? (
            <ActivityIndicator size="small" color="#A1A1A6" />
          ) : null}
          <Text className="text-[17px] font-bold text-ink">
            {formatPrice(total)}
          </Text>
        </View>
      </View>

      {quote === undefined && !isLoading ? (
        <Text className="mt-2 text-[12px] text-ink-secondary">
          Доставку и итог посчитает ресторан, когда выберете, как получить
          заказ.
        </Text>
      ) : null}
    </View>
  );
}
