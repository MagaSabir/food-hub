import { Pressable, Text, View } from 'react-native';
import { HouseIcon, TrashIcon } from 'phosphor-react-native';
import type { UserAddressView } from '@foodhubme/shared';
import { fullAddress } from '../model/address-store';

interface SavedAddressesProps {
  addresses: UserAddressView[];
  onPick: (address: UserAddressView) => void;
  onRemove: (address: UserAddressView) => void;
}

export function SavedAddresses({
  addresses,
  onPick,
  onRemove,
}: SavedAddressesProps) {
  if (addresses.length === 0) return null;

  return (
    <View className="px-5 pt-4">
      <Text className="text-[13px] font-semibold uppercase text-ink-secondary">
        Сохранённые
      </Text>

      {addresses.map((item) => (
        <View key={item.id} className="flex-row items-center">
          <Pressable
            onPress={() => onPick(item)}
            accessibilityRole="button"
            accessibilityLabel={`Выбрать адрес: ${fullAddress(item)}`}
            className="flex-1 flex-row items-center gap-3 py-3 active:opacity-60"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
              <HouseIcon size={18} color="#49B85D" weight="fill" />
            </View>

            <View className="flex-1">
              {}
              <Text className="text-[15px] text-ink" numberOfLines={1}>
                {fullAddress(item)}
              </Text>
              {item.details ? (
                <Text
                  className="mt-0.5 text-[13px] text-ink-secondary"
                  numberOfLines={1}
                >
                  {item.details}
                </Text>
              ) : null}
            </View>
          </Pressable>

          <Pressable
            onPress={() => onRemove(item)}
            accessibilityRole="button"
            accessibilityLabel={`Убрать адрес: ${fullAddress(item)}`}
            hitSlop={10}
            className="px-2 py-3 active:opacity-60"
          >
            <TrashIcon size={18} color="#A1A1A6" />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
