import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import type { OrderListItemView } from '@foodhubme/shared';
import { useMyOrders } from '@/entities/order';
import { SignInInvite } from '@/features/auth';
import { useSessionStore } from '@/entities/session';
import { OrderRow } from './ui/order-row';
import { tabBarContentPadding } from '@/shared/lib/tab-bar';
import { QueryErrorState } from '@/shared/ui/query-error-state';
import { queryFailure } from '@/shared/lib/query-failure';

export function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const status = useSessionStore((state) => state.status);
  const isAuthenticated = status === 'authenticated';

  const ordersQuery = useMyOrders(isAuthenticated);
  const { data: orders, isLoading, refetch, isRefetching } = ordersQuery;
  const failure = queryFailure(ordersQuery);

  if (status === 'unknown') return <View className="flex-1 bg-canvas" />;

  if (!isAuthenticated) {
    return <SignInInvite note="Войдите, чтобы видеть историю своих заказов" />;
  }

  const openOrder = (order: OrderListItemView) =>
    router.push({ pathname: '/order/[id]', params: { id: order.id } });

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <Text className="px-4 pb-2 pt-1 text-[24px] font-bold text-ink">
        Заказы
      </Text>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#49B85D" />
        </View>
      ) : failure ? (
        <QueryErrorState error={failure} onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(order) => order.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: tabBarContentPadding(insets.bottom),
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor="#49B85D"
            />
          }
          renderItem={({ item }) => (
            <OrderRow order={item} onPress={() => openOrder(item)} />
          )}
          ListEmptyComponent={
            <View className="items-center px-8 pt-24">
              <Text className="text-center text-[17px] font-semibold text-ink">
                Заказов пока нет
              </Text>
              <Text className="mt-2 text-center text-[14px] text-ink-secondary">
                Здесь появится история — с составом, суммой и статусом.
              </Text>
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                accessibilityRole="button"
                className="mt-5 rounded-full bg-primary-500 px-6 py-3 active:bg-primary-700"
              >
                <Text className="text-[15px] font-semibold text-white">
                  Выбрать заведение
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
