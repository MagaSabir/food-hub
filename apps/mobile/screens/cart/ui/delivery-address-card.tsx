import { Pressable, Text, View } from 'react-native';
import { CaretRightIcon, MapPinIcon } from 'phosphor-react-native';
import { fullAddress, type DeliveryAddress } from '@/features/address-input';

interface DeliveryAddressCardProps {
  address: DeliveryAddress | null;
  onPress: () => void;
}

export function DeliveryAddressCard({
  address,
  onPress,
}: DeliveryAddressCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        address ? 'Изменить адрес доставки' : 'Указать адрес доставки'
      }
      className="rounded-[20px] bg-white p-4 active:opacity-70"
    >
      <View className="flex-row items-center gap-2">
        <MapPinIcon size={20} color="#1D1D1F" weight="bold" />
        <Text className="flex-1 text-[17px] font-bold text-ink">
          Адрес доставки
        </Text>
        <Text className="text-[15px] font-semibold text-primary-500">
          {address ? 'Изменить' : 'Указать'}
        </Text>
        <CaretRightIcon size={16} color="#49B85D" weight="bold" />
      </View>

      {address ? (
        <>
          {}
          <Text className="mt-3 text-[15px] text-ink">
            {fullAddress(address)}
          </Text>
          {address.details ? (
            <Text className="mt-1 text-[14px] text-ink-secondary">
              {address.details}
            </Text>
          ) : null}
        </>
      ) : (
        <Text className="mt-3 text-[14px] text-ink-secondary">
          Без адреса не посчитать доставку — её стоимость зависит от расстояния
          до ресторана.
        </Text>
      )}
    </Pressable>
  );
}
