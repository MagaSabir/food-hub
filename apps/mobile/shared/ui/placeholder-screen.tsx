import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Экран-заглушка для табов, которые оживут на своих этапах.
 * Единый вид: заголовок + подпись на фоне canvas.
 */
export function PlaceholderScreen({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-[28px] font-bold text-ink">{title}</Text>
        {note ? (
          <Text className="mt-2 text-center text-[15px] text-ink-secondary">
            {note}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
