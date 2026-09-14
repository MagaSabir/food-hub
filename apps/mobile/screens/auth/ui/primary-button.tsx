import { ActivityIndicator, Pressable, Text } from 'react-native';

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const blocked = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      className={`h-14 items-center justify-center rounded-2xl ${
        blocked ? 'bg-primary-200' : 'bg-primary-500 active:bg-primary-700'
      }`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-[17px] font-semibold text-white">{label}</Text>
      )}
    </Pressable>
  );
}
