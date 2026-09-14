import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface SearchMessageProps {
  icon: ReactNode;
  title: string;
  note: string;
  action?: { label: string; onPress: () => void };
}

export function SearchMessage({
  icon,
  title,
  note,
  action,
}: SearchMessageProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 pb-24">
      {icon}

      <Text className="mt-4 text-center text-[17px] font-bold text-ink">
        {title}
      </Text>
      <Text className="mt-2 text-center text-[15px] leading-[22px] text-ink-secondary">
        {note}
      </Text>

      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          className="mt-5 rounded-full bg-primary-500 px-6 py-3 active:bg-primary-700"
        >
          <Text className="text-[15px] font-semibold text-white">
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
