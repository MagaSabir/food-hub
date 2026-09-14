import { Pressable, Text, View } from 'react-native';
import { HouseIcon, TrashIcon } from 'phosphor-react-native';
import type { UserAddressView } from '@foodhubme/shared';
import { fullAddress } from '@/features/address-input';
import { surfaceShadow } from '@/shared/lib/surface';

interface AddressRowProps {
  address: UserAddressView;
  onMakeDefault: () => void;
  onRemove: () => void;
}

export function AddressRow({
  address,
  onMakeDefault,
  onRemove,
}: AddressRowProps) {
  const isDefault = address.isDefault;

  return (
    <Pressable
      onPress={onMakeDefault}
      disabled={isDefault}
      accessibilityRole="button"
      accessibilityLabel={
        isDefault
          ? `Основной адрес: ${fullAddress(address)}`
          : `Сделать основным: ${fullAddress(address)}`
      }
      className={`mt-3 flex-row items-center gap-3 rounded-card border bg-white px-4 py-3.5 ${
        isDefault ? 'border-primary-500' : 'border-hairline active:opacity-70'
      }`}
      style={surfaceShadow}
    >
      <View
        className={`h-11 w-11 items-center justify-center rounded-full ${
          isDefault ? 'bg-primary-50' : 'bg-surface-2'
        }`}
      >
        <HouseIcon size={22} color="#49B85D" weight="fill" />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="flex-1 text-[16px] font-medium text-ink"
            numberOfLines={2}
          >
            {fullAddress(address)}
          </Text>

          {isDefault ? (
            <View className="rounded-full bg-primary-50 px-2.5 py-1">
              <Text className="text-[12px] font-semibold text-primary-600">
                Основной
              </Text>
            </View>
          ) : null}
        </View>

        {address.details ? (
          <Text
            className="mt-0.5 text-[13px] text-ink-secondary"
            numberOfLines={1}
          >
            {address.details}
          </Text>
        ) : null}
      </View>

      {}
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Удалить адрес: ${fullAddress(address)}`}
        hitSlop={10}
        className="h-9 w-9 items-center justify-center rounded-full active:opacity-60"
      >
        <TrashIcon size={20} color="#A1A1A6" />
      </Pressable>
    </Pressable>
  );
}
