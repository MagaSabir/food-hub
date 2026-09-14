import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { CaretLeftIcon, MapPinIcon, PlusIcon } from 'phosphor-react-native';
import { MAX_SAVED_ADDRESSES } from '@foodhubme/shared';
import {
  AddressSheet,
  useAddressStore,
  useMakeAddressDefault,
  useRemoveAddress,
  useSavedAddresses,
} from '@/features/address-input';
import { SignInInvite } from '@/features/auth';
import { useSessionStore } from '@/entities/session';
import { AddressRow } from './ui/address-row';
import { QueryErrorState } from '@/shared/ui/query-error-state';
import { queryFailure } from '@/shared/lib/query-failure';

export function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const status = useSessionStore((state) => state.status);

  const addressesQuery = useSavedAddresses();
  const { data: addresses, isLoading, refetch } = addressesQuery;
  const failure = queryFailure(addressesQuery);
  const makeDefault = useMakeAddressDefault();
  const remove = useRemoveAddress();

  const currentAddress = useAddressStore((state) => state.address);
  const setAddress = useAddressStore((state) => state.setAddress);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (status === 'unknown') return <View className="flex-1 bg-canvas" />;

  if (status !== 'authenticated') {
    return <SignInInvite note="Войдите, чтобы сохранять адреса доставки" />;
  }

  const list = addresses ?? [];
  const canAddMore = list.length < MAX_SAVED_ADDRESSES;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      {}
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-1">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Назад"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
        >
          <CaretLeftIcon size={24} color="#1D1D1F" weight="bold" />
        </Pressable>

        <Text className="text-[24px] font-bold text-ink">Адреса</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#49B85D" />
        </View>
      ) : failure ? (
        <QueryErrorState error={failure} onRetry={() => void refetch()} />
      ) : list.length > 0 ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {list.map((item) => (
            <AddressRow
              key={item.id}
              address={item}
              onMakeDefault={() => makeDefault.mutate(item.id)}
              onRemove={() => remove.mutate(item.id)}
            />
          ))}

          {canAddMore ? (
            <Pressable
              onPress={() => setIsSheetOpen(true)}
              accessibilityRole="button"
              className="mt-4 min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-primary-500 py-3 active:opacity-70"
            >
              <PlusIcon size={20} color="#49B85D" weight="bold" />
              <Text className="text-[16px] font-semibold text-primary-600">
                Добавить адрес
              </Text>
            </Pressable>
          ) : (
            <Text className="mt-4 text-center text-[13px] text-ink-secondary">
              Сохранено максимум — {MAX_SAVED_ADDRESSES}. Удалите лишний, чтобы
              добавить новый.
            </Text>
          )}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <MapPinIcon size={40} color="#C7C7CC" weight="bold" />
          <Text className="mt-4 text-center text-[17px] font-bold text-ink">
            Пока пусто
          </Text>
          <Text className="mt-2 text-center text-[15px] leading-[22px] text-ink-secondary">
            Сохранённый адрес не придётся вводить заново — он подставится сам
            при следующем заказе.
          </Text>
          <Pressable
            onPress={() => setIsSheetOpen(true)}
            accessibilityRole="button"
            className="mt-6 rounded-full bg-primary-500 px-6 py-3 active:bg-primary-700"
          >
            <Text className="text-[15px] font-semibold text-white">
              Добавить адрес
            </Text>
          </Pressable>
        </View>
      )}

      {}
      <AddressSheet
        visible={isSheetOpen}
        current={currentAddress}
        showSaved={false}
        onSave={setAddress}
        onClose={() => setIsSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
