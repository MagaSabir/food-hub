import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeftIcon, MapPinIcon, XIcon } from 'phosphor-react-native';
import { MAX_SAVED_ADDRESSES } from '@foodhubme/shared';
import { useSessionStore } from '@/entities/session';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import {
  useAddressSuggest,
  type AddressSuggestion,
} from '../api/use-address-suggest';
import type { DeliveryAddress } from '../model/address-store';
import {
  useMakeAddressDefault,
  useRemoveAddress,
  useSaveAddress,
  useSavedAddresses,
} from '../api/use-saved-addresses';
import { SavedAddresses } from './saved-addresses';

interface AddressSheetProps {
  visible: boolean;
  current: DeliveryAddress | null;
  showSaved?: boolean;
  onSave: (address: DeliveryAddress) => void;
  onClose: () => void;
}

export function AddressSheet({
  visible,
  current,
  showSaved = true,
  onSave,
  onClose,
}: AddressSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<AddressSuggestion | null>(null);
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setDetails(current?.details ?? '');
    setPicked(
      current
        ? {
            id: 'current',
            title: current.address,
            subtitle: '',
            locality: current.locality,
            latitude: current.latitude,
            longitude: current.longitude,
          }
        : null,
    );
  }, [visible, current]);

  const debouncedQuery = useDebouncedValue(query, 450);
  const {
    data: suggestions,
    isFetching,
    isError,
  } = useAddressSuggest(picked === null ? debouncedQuery : '');

  const isAuthenticated =
    useSessionStore((state) => state.status) === 'authenticated';
  const { data: saved } = useSavedAddresses();
  const savedAddresses = saved ?? [];
  const saveToBook = useSaveAddress();
  const makeDefault = useMakeAddressDefault();
  const removeSaved = useRemoveAddress();

  const [rememberIt, setRememberIt] = useState(true);
  const canRemember =
    isAuthenticated && savedAddresses.length < MAX_SAVED_ADDRESSES;

  const use = (address: DeliveryAddress) => {
    onSave(address);
    onClose();
  };

  const save = () => {
    if (!picked) return;

    const address: DeliveryAddress = {
      address: picked.title,
      locality: picked.locality,
      details: details.trim() === '' ? null : details.trim(),
      latitude: picked.latitude,
      longitude: picked.longitude,
    };

    if (canRemember && rememberIt) {
      saveToBook.mutate({
        address: address.address,
        locality: address.locality,
        details: address.details,
        latitude: address.latitude,
        longitude: address.longitude,
      });
    }

    use(address);
  };

  const pickSaved = (item: (typeof savedAddresses)[number]) => {
    if (!item.isDefault) makeDefault.mutate(item.id);

    use({
      address: item.address,
      locality: item.locality,
      details: item.details,
      latitude: item.latitude,
      longitude: item.longitude,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          className="rounded-t-[24px] bg-white"
          style={{
            maxHeight: height * 0.86,
            paddingBottom: insets.bottom + 12,
          }}
        >
          <View className="items-center pt-2.5">
            <View className="h-1 w-10 rounded-full bg-hairline" />
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
            hitSlop={8}
            className="absolute right-4 top-4 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 active:opacity-70"
          >
            <XIcon size={18} color="#1D1D1F" weight="bold" />
          </Pressable>

          <Text className="px-5 pt-4 text-[24px] font-bold text-ink">
            Адрес доставки
          </Text>

          {picked === null ? (
            <>
              {showSaved ? (
                <SavedAddresses
                  addresses={savedAddresses}
                  onPick={pickSaved}
                  onRemove={(item) => removeSaved.mutate(item.id)}
                />
              ) : null}

              <View className="mt-4 px-5">
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                  placeholder="Улица и дом"
                  placeholderTextColor="#A1A1A6"
                  returnKeyType="search"
                  className="h-14 rounded-search bg-surface-2 px-4 text-[17px] text-ink"
                />
                <Text className="mt-2 text-[13px] text-ink-secondary">
                  Выберите дом из подсказок — по нему считается стоимость
                  доставки.
                </Text>
              </View>

              <ScrollView
                className="mt-2 px-5"
                contentContainerStyle={{ paddingBottom: 12 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {isFetching ? (
                  <View className="items-center py-6">
                    <ActivityIndicator color="#49B85D" />
                  </View>
                ) : null}

                {isError ? (
                  <Text className="py-6 text-center text-[14px] text-ink-secondary">
                    Поиск адреса сейчас не отвечает. Попробуйте ещё раз или
                    закажите самовывоз.
                  </Text>
                ) : null}

                {!isFetching && suggestions?.length === 0 ? (
                  <Text className="py-6 text-center text-[14px] text-ink-secondary">
                    Ничего не нашли. Попробуйте написать иначе — например,
                    «Путина 12».
                  </Text>
                ) : null}

                {suggestions?.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setPicked(item)}
                    accessibilityRole="button"
                    className="flex-row items-center gap-3 border-b border-hairline py-3 active:opacity-60"
                  >
                    <MapPinIcon size={20} color="#6E6E73" />
                    <View className="flex-1">
                      <Text className="text-[16px] text-ink">{item.title}</Text>
                      {item.subtitle ? (
                        <Text className="mt-0.5 text-[13px] text-ink-secondary">
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : (
            <View className="px-5 pt-4">
              <View className="flex-row items-center gap-3 rounded-[16px] bg-surface-2 p-4">
                <MapPinIcon size={20} color="#49B85D" weight="fill" />
                <Text className="flex-1 text-[16px] text-ink">
                  {picked.title}
                </Text>
                <Pressable
                  onPress={() => setPicked(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Выбрать другой адрес"
                  hitSlop={8}
                  className="flex-row items-center active:opacity-60"
                >
                  <CaretLeftIcon size={16} color="#49B85D" weight="bold" />
                  <Text className="text-[15px] font-semibold text-primary-500">
                    Другой
                  </Text>
                </Pressable>
              </View>

              <Text className="mt-5 text-[15px] font-semibold text-ink">
                Подъезд, этаж, домофон
              </Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Например: подъезд 2, этаж 5, код 12К"
                placeholderTextColor="#A1A1A6"
                multiline
                className="mt-2 min-h-14 rounded-search bg-surface-2 px-4 py-3 text-[17px] text-ink"
              />
              <Text className="mt-2 text-[13px] text-ink-secondary">
                Необязательно — но курьер найдёт вас быстрее.
              </Text>

              {canRemember ? (
                <Pressable
                  onPress={() => setRememberIt((value) => !value)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberIt }}
                  className="mt-5 flex-row items-center gap-3 active:opacity-70"
                >
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-md border ${
                      rememberIt
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-hairline bg-white'
                    }`}
                  >
                    {rememberIt ? (
                      <Text className="text-[13px] font-bold text-white">
                        ✓
                      </Text>
                    ) : null}
                  </View>
                  <Text className="flex-1 text-[15px] text-ink">
                    Запомнить этот адрес
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={save}
                accessibilityRole="button"
                className="mt-6 h-14 items-center justify-center rounded-full bg-primary-500 active:bg-primary-700"
              >
                <Text className="text-[17px] font-bold text-white">
                  Сохранить адрес
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
