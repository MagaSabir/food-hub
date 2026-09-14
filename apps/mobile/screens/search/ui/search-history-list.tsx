import { Pressable, Text, View } from 'react-native';
import { ClockCounterClockwiseIcon, XIcon } from 'phosphor-react-native';

interface SearchHistoryListProps {
  queries: string[];
  onPick: (query: string) => void;
  onForget: (query: string) => void;
  onClear: () => void;
}

export function SearchHistoryList({
  queries,
  onPick,
  onForget,
  onClear,
}: SearchHistoryListProps) {
  return (
    <View className="px-4 pt-2">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-[13px] font-semibold uppercase text-ink-secondary">
          Вы искали
        </Text>

        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          hitSlop={8}
          className="active:opacity-60"
        >
          <Text className="text-[13px] font-semibold text-primary-500">
            Очистить
          </Text>
        </Pressable>
      </View>

      {queries.map((query) => (
        <View key={query} className="flex-row items-center">
          <Pressable
            onPress={() => onPick(query)}
            accessibilityRole="button"
            accessibilityLabel={`Искать снова: ${query}`}
            className="flex-1 flex-row items-center gap-3 py-3 active:opacity-60"
          >
            <ClockCounterClockwiseIcon size={18} color="#A1A1A6" />
            <Text className="flex-1 text-[15px] text-ink" numberOfLines={1}>
              {query}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onForget(query)}
            accessibilityRole="button"
            accessibilityLabel={`Убрать из истории: ${query}`}
            hitSlop={10}
            className="px-2 py-3 active:opacity-60"
          >
            <XIcon size={16} color="#A1A1A6" />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
