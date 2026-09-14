import { Pressable, TextInput, View } from 'react-native';
import { MagnifyingGlassIcon, XCircleIcon } from 'phosphor-react-native';
import { surfaceShadow } from '@/shared/lib/surface';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function SearchField({ value, onChange, onSubmit }: SearchFieldProps) {
  return (
    <View className="px-4 pb-2 pt-1">
      <View
        className="min-h-[50px] flex-row items-center gap-3 rounded-[18px] border border-hairline bg-white px-4 py-1"
        style={surfaceShadow}
      >
        <MagnifyingGlassIcon size={22} color="#6E6E73" />

        <TextInput
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          placeholder="Блюдо или заведение"
          placeholderTextColor="#A1A1A6"
          accessibilityLabel="Поиск блюд и заведений"
          returnKeyType="search"
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          className="flex-1 text-[15px] text-ink"
        />

        {}
        {value.length > 0 ? (
          <Pressable
            onPress={() => onChange('')}
            accessibilityRole="button"
            accessibilityLabel="Очистить поиск"
            hitSlop={8}
            className="active:opacity-60"
          >
            <XCircleIcon size={20} color="#A1A1A6" weight="fill" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
