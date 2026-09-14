import { Pressable, Text, View } from 'react-native';
import { BellIcon, CaretDownIcon, MapPinIcon } from 'phosphor-react-native';
import { surfaceShadow } from '@/shared/lib/surface';

interface CatalogHeaderProps {
  city: string;
  address: string | null;
  addressPlaceholder?: string;
  onPressAddress: () => void;
  hasUnreadNotifications?: boolean;
}

export function CatalogHeader({
  city,
  address,
  addressPlaceholder = 'Указать адрес доставки',
  onPressAddress,
  hasUnreadNotifications = false,
}: CatalogHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pb-3 pt-1">
      {}
      <Pressable
        onPress={onPressAddress}
        accessibilityRole="button"
        accessibilityLabel={
          address
            ? `Адрес доставки: ${city}, ${address}. Изменить`
            : addressPlaceholder
        }
        className="flex-1 flex-row items-center gap-2 active:opacity-60"
      >
        <MapPinIcon size={28} color="#49B85D" weight="fill" />
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Text
              className="shrink text-[17px] font-bold text-ink"
              numberOfLines={1}
            >
              {city}
            </Text>
            <CaretDownIcon size={16} color="#1D1D1F" weight="bold" />
          </View>
          <Text
            className={`text-[13px] font-medium ${
              address ? 'text-ink-secondary' : 'text-primary-600'
            }`}
            numberOfLines={1}
          >
            {address ?? addressPlaceholder}
          </Text>
        </View>
      </Pressable>

      {}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          hasUnreadNotifications ? 'Уведомления, есть новые' : 'Уведомления'
        }
        className="h-11 w-11 items-center justify-center rounded-2xl border border-hairline bg-white active:opacity-70"
        style={surfaceShadow}
      >
        <BellIcon size={24} color="#1D1D1F" />
        {hasUnreadNotifications ? (
          <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary-500" />
        ) : null}
      </Pressable>
    </View>
  );
}
