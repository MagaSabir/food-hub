import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export function ScreenLoading() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas">
      <ActivityIndicator color="#49B85D" />
    </View>
  );
}

export function ScreenMessage({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center bg-canvas px-8">
      <Text className="text-center text-[17px] font-semibold text-ink">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-2 text-center text-[14px] text-ink-secondary">
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          className="mt-5 rounded-full bg-primary-500 px-6 py-3 active:bg-primary-700"
        >
          <Text className="text-[15px] font-semibold text-white">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
