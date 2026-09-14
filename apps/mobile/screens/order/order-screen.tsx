import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CaretLeftIcon,
  CheckCircleIcon,
  CreditCardIcon,
  ForkKnifeIcon,
} from 'phosphor-react-native';
import { OrderStatus, OrderType, RepeatSkipReason } from '@foodhubme/shared';
import { orderTypeLabel, useOrder } from '@/entities/order';
import { OrderStatusTracker } from '@/widgets/order-status-tracker';
import { useRepeatOrder } from '@/features/cart';
import { formatPrice } from '@/shared/lib/format-price';
import { QueryErrorState } from '@/shared/ui/query-error-state';
import { queryFailure } from '@/shared/lib/query-failure';

export function OrderScreen() {
  const params = useLocalSearchParams<{ id: string; created?: string }>();
  const orderId = params.id ?? '';
  const isJustCreated = params.created === '1';

  const orderQuery = useOrder(orderId);
  const { data: order, isLoading, refetch } = orderQuery;
  const failure = queryFailure(orderQuery);

  const repeat = useRepeatOrder();

  const repeatOrder = () =>
    repeat.mutate(orderId, {
      onSuccess: (plan) => {
        if (plan.items.length === 0) return;

        router.push('/cart');
      },
    });

  const skippedNote = (): string | null => {
    const skipped = repeat.data?.skipped ?? [];
    if (skipped.length === 0) return null;

    const gone = skipped.filter(
      (item) => item.reason === RepeatSkipReason.REMOVED,
    ).length;
    const today = skipped.length - gone;

    return [
      gone > 0 ? `${gone} поз. больше нет в меню` : null,
      today > 0 ? `${today} поз. недоступно сегодня` : null,
    ]
      .filter(Boolean)
      .join(', ');
  };

  const goBack = () => {
    if (isJustCreated) router.replace('/(tabs)');
    else router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-1">
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Назад"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
        >
          <CaretLeftIcon size={24} color="#1D1D1F" weight="bold" />
        </Pressable>
        <Text className="text-[24px] font-bold text-ink">
          {order ? `Заказ №${order.orderNumber}` : 'Заказ'}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#49B85D" />
        </View>
      ) : null}

      {failure ? (
        <QueryErrorState error={failure} onRetry={() => void refetch()} />
      ) : null}

      {order ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-3 px-4">
            {isJustCreated ? (
              <View className="flex-row items-center gap-3 rounded-[20px] bg-primary-50 p-4">
                <CheckCircleIcon size={28} color="#49B85D" weight="fill" />
                <View className="flex-1">
                  <Text className="text-[17px] font-bold text-ink">
                    Заказ принят
                  </Text>
                  <Text className="mt-1 text-[14px] text-ink-secondary">
                    Ресторан подтвердит его в ближайшие минуты — статус ниже
                    обновится сам.
                  </Text>
                </View>
              </View>
            ) : null}

            {}
            <OrderStatusTracker
              status={order.status}
              orderType={order.orderType}
              prepMinutes={order.prepMinutes}
              cancelReason={order.cancelReason}
            />

            <View className="rounded-[20px] bg-white p-4">
              <Text className="text-[15px] text-ink">
                {order.restaurantName}
              </Text>
              <Text className="mt-1 text-[14px] text-ink-secondary">
                {orderTypeLabel(order.orderType)}
                {' · '}
                {order.orderType === OrderType.DELIVERY
                  ? (order.deliveryAddress ?? order.branchAddress)
                  : order.branchAddress}
              </Text>
              {order.deliveryDetails ? (
                <Text className="mt-1 text-[14px] text-ink-secondary">
                  {order.deliveryDetails}
                </Text>
              ) : null}
              {order.comment ? (
                <Text className="mt-2 text-[14px] text-ink-secondary">
                  Комментарий: {order.comment}
                </Text>
              ) : null}
            </View>

            <View className="rounded-[20px] bg-white p-4">
              {order.items.map((item) => (
                <View
                  key={item.id}
                  className="mb-3 flex-row items-center gap-3"
                >
                  {}
                  <View className="h-9 min-w-9 items-center justify-center rounded-[10px] bg-surface-2 px-2">
                    <Text className="text-[13px] font-semibold text-ink-secondary">
                      {item.quantity} ×
                    </Text>
                  </View>

                  {}
                  {item.photoUrl ? (
                    <Image
                      source={{ uri: item.photoUrl }}
                      style={{ width: 44, height: 44, borderRadius: 10 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="h-11 w-11 items-center justify-center rounded-[10px] bg-surface-2">
                      <ForkKnifeIcon size={18} color="#A1A1A6" />
                    </View>
                  )}

                  <View className="flex-1">
                    <Text className="text-[15px] text-ink">{item.name}</Text>
                    {item.modifiers.length > 0 ? (
                      <Text className="mt-0.5 text-[13px] text-ink-secondary">
                        {item.modifiers
                          .map((modifier) => modifier.optionName)
                          .join(', ')}
                      </Text>
                    ) : null}
                  </View>

                  <Text className="text-[15px] text-ink">
                    {formatPrice(item.lineTotal)}
                  </Text>
                </View>
              ))}

              {}
              <View className="mt-1 border-t border-dashed border-hairline pt-3">
                <View className="flex-row justify-between">
                  <Text className="text-[15px] text-ink-secondary">Товары</Text>
                  <Text className="text-[15px] text-ink">
                    {formatPrice(order.itemsTotal)}
                  </Text>
                </View>
                {order.orderType === OrderType.DELIVERY ? (
                  <View className="mt-2 flex-row justify-between">
                    <Text className="text-[15px] text-ink-secondary">
                      Доставка
                    </Text>
                    <Text className="text-[15px] text-ink">
                      {order.deliveryFee === 0
                        ? 'Бесплатно'
                        : formatPrice(order.deliveryFee)}
                    </Text>
                  </View>
                ) : null}
                {}
                <View className="mt-3 flex-row justify-between rounded-[12px] bg-primary-50 px-3 py-2.5">
                  <Text className="text-[17px] font-bold text-ink">Итого</Text>
                  <Text className="text-[17px] font-bold text-ink">
                    {formatPrice(order.total)}
                  </Text>
                </View>

                <View className="mt-3 flex-row items-center gap-2">
                  <CreditCardIcon size={18} color="#6E6E73" />
                  <Text className="text-[13px] text-ink-secondary">
                    Наличными при получении
                  </Text>
                </View>
              </View>
            </View>

            {}
            {order.status === OrderStatus.COMPLETED ||
            order.status === OrderStatus.CANCELLED ? (
              <View className="mt-2 gap-2">
                <Pressable
                  onPress={repeatOrder}
                  disabled={repeat.isPending}
                  accessibilityRole="button"
                  className={`h-14 items-center justify-center rounded-full ${
                    repeat.isPending
                      ? 'bg-surface-2'
                      : 'bg-primary-500 active:bg-primary-700'
                  }`}
                >
                  {repeat.isPending ? (
                    <ActivityIndicator color="#49B85D" />
                  ) : (
                    <Text className="text-[17px] font-bold text-white">
                      Повторить заказ
                    </Text>
                  )}
                </Pressable>

                {repeat.isError ? (
                  <Text className="text-center text-[13px] text-error">
                    Не удалось собрать корзину. Попробуйте ещё раз.
                  </Text>
                ) : skippedNote() ? (
                  <Text className="text-center text-[13px] text-ink-secondary">
                    {skippedNote()}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {}
            {isJustCreated ? (
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                accessibilityRole="button"
                className="mt-2 h-14 items-center justify-center rounded-full bg-primary-500 active:bg-primary-700"
              >
                <Text className="text-[17px] font-bold text-white">
                  В каталог
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
