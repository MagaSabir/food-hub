import { Pressable, Text, View } from 'react-native';
import { CaretRightIcon, ClockIcon, MapPinIcon } from 'phosphor-react-native';
import type { BranchInfo } from '@foodhubme/shared';

interface PickupPointCardProps {
  branch: BranchInfo | null;
  canChange: boolean;
  onChange: () => void;
}

export function PickupPointCard({
  branch,
  canChange,
  onChange,
}: PickupPointCardProps) {
  return (
    <View className="rounded-[20px] bg-white p-4">
      <View className="flex-row items-center gap-2">
        <MapPinIcon size={20} color="#1D1D1F" weight="bold" />
        <Text className="text-[17px] font-bold text-ink">Точка получения</Text>
      </View>

      {branch === null ? (
        <Text className="mt-3 text-[14px] text-ink-secondary">
          У заведения нет точки, куда можно приехать за заказом.
        </Text>
      ) : (
        <>
          <View className="mt-3 flex-row items-center gap-2">
            <MapPinIcon size={18} color="#6E6E73" />
            <Text className="flex-1 text-[15px] text-ink" numberOfLines={2}>
              {branch.address}
            </Text>

            {canChange ? (
              <Pressable
                onPress={onChange}
                accessibilityRole="button"
                accessibilityLabel="Изменить точку получения"
                hitSlop={8}
                className="flex-row items-center gap-1 active:opacity-60"
              >
                <Text className="text-[15px] font-semibold text-primary-500">
                  Изменить
                </Text>
                <CaretRightIcon size={16} color="#49B85D" weight="bold" />
              </Pressable>
            ) : null}
          </View>

          <View className="mt-2 flex-row items-center gap-2">
            <ClockIcon size={18} color="#6E6E73" />
            {}
            <Text className="text-[14px] text-ink-secondary">
              {branch.isOpen
                ? branch.closesAt
                  ? `Открыто до ${branch.closesAt}`
                  : 'Открыто'
                : 'Сейчас закрыто'}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}
