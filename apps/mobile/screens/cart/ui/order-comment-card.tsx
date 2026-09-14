import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { CaretRightIcon } from 'phosphor-react-native';
import { ORDER_LIMITS } from '@foodhubme/shared';

interface OrderCommentCardProps {
  value: string;
  onChange: (value: string) => void;
}

export function OrderCommentCard({ value, onChange }: OrderCommentCardProps) {
  const [isOpen, setOpen] = useState(false);

  if (!isOpen) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Комментарий к заказу"
        className="flex-row items-center gap-2 rounded-[20px] bg-white p-4 active:opacity-70"
      >
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-ink">
            Комментарий к заказу
          </Text>
          <Text
            className={`mt-1 text-[14px] ${
              value ? 'text-ink' : 'text-ink-secondary'
            }`}
            numberOfLines={2}
          >
            {value || 'Пожелания, аллергии и другое'}
          </Text>
        </View>
        <CaretRightIcon size={18} color="#A1A1A6" weight="bold" />
      </Pressable>
    );
  }

  return (
    <View className="rounded-[20px] bg-white p-4">
      <Text className="text-[15px] font-semibold text-ink">
        Комментарий к заказу
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        autoFocus
        multiline
        maxLength={ORDER_LIMITS.MAX_COMMENT_LENGTH}
        placeholder="Пожелания, аллергии и другое"
        placeholderTextColor="#A1A1A6"
        onBlur={() => setOpen(false)}
        className="mt-2 min-h-14 rounded-search bg-surface-2 px-4 py-3 text-[16px] text-ink"
      />
    </View>
  );
}
