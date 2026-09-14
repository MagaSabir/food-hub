import { Pressable } from 'react-native';
import { CaretLeftIcon } from 'phosphor-react-native';
import { surfaceShadow } from '@/shared/lib/surface';

export function AuthBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Назад"
      className="h-12 w-12 items-center justify-center rounded-full bg-white active:opacity-70"
      style={surfaceShadow}
    >
      <CaretLeftIcon size={22} color="#1D1D1F" weight="bold" />
    </Pressable>
  );
}
