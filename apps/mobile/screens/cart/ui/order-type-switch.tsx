import { Pressable, Text, View } from 'react-native';
import {
  ForkKnifeIcon,
  MopedIcon,
  ShoppingBagIcon,
} from 'phosphor-react-native';
import { OrderType } from '@foodhubme/shared';

interface OrderTypeSwitchProps {
  value: OrderType;
  onChange: (type: OrderType) => void;
  available: Record<OrderType, boolean>;
}

const OPTIONS = [
  { type: OrderType.DELIVERY, label: 'Доставка', Icon: MopedIcon },
  { type: OrderType.PICKUP, label: 'Самовывоз', Icon: ShoppingBagIcon },
  { type: OrderType.DINE_IN, label: 'В ресторане', Icon: ForkKnifeIcon },
] as const;

export function OrderTypeSwitch({
  value,
  onChange,
  available,
}: OrderTypeSwitchProps) {
  return (
    <View className="flex-row rounded-[20px] bg-white p-1.5">
      {OPTIONS.map(({ type, label, Icon }) => {
        const isActive = value === type;
        const isAvailable = available[type];
        const color = !isAvailable
          ? '#C7C7CC'
          : isActive
            ? '#49B85D'
            : '#1D1D1F';

        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            disabled={!isAvailable}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive, disabled: !isAvailable }}
            accessibilityLabel={label}
            className={`flex-1 items-center gap-1 rounded-[16px] py-3 ${
              isActive ? 'bg-primary-50' : ''
            }`}
          >
            <Icon
              size={24}
              color={color}
              weight={isActive ? 'fill' : 'regular'}
            />
            <Text
              className={`text-[13px] ${
                isActive ? 'font-semibold text-primary-700' : 'text-ink'
              } ${isAvailable ? '' : 'text-ink-disabled'}`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
