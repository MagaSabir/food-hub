import { Pressable, Text, View } from 'react-native';
import { CaretRightIcon } from 'phosphor-react-native';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
      <Text className="text-[19px] font-bold text-ink">{title}</Text>
      {onSeeAll ? (
        <Pressable
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel={`Смотреть все: ${title}`}
          className="flex-row items-center gap-0.5 active:opacity-60"
        >
          <Text className="text-[15px] font-medium text-primary-500">
            Смотреть все
          </Text>
          <CaretRightIcon size={16} color="#49B85D" weight="bold" />
        </Pressable>
      ) : null}
    </View>
  );
}
