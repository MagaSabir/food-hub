import { Pressable, TextInput, View } from 'react-native';
import {
  MagnifyingGlassIcon,
  SlidersHorizontalIcon,
  XCircleIcon,
} from 'phosphor-react-native';
import { surfaceShadow } from '@/shared/lib/surface';

interface CatalogSearchProps {
  value: string;
  onChange: (value: string) => void;
  onOpenFilters: () => void;
  hasFilters: boolean;
}

export function CatalogSearch({
  value,
  onChange,
  onOpenFilters,
  hasFilters,
}: CatalogSearchProps) {
  return (
    <View className="px-5 pb-2 pt-1">
      <View
        className="min-h-[50px] flex-row items-center gap-3 rounded-[18px] border border-hairline bg-white py-1 pl-4 pr-2"
        style={surfaceShadow}
      >
        <MagnifyingGlassIcon size={22} color="#6E6E73" />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Поиск по названию или кухне"
          placeholderTextColor="#A1A1A6"
          accessibilityLabel="Поиск ресторанов"
          returnKeyType="search"
          autoCorrect={false}
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

        <Pressable
          onPress={onOpenFilters}
          accessibilityRole="button"
          accessibilityLabel="Фильтры и сортировка"
          className={`h-10 w-10 items-center justify-center rounded-xl active:opacity-70 ${
            hasFilters ? 'bg-primary-500' : 'bg-surface-2'
          }`}
        >
          <SlidersHorizontalIcon
            size={20}
            color={hasFilters ? '#FFFFFF' : '#49B85D'}
          />
        </Pressable>
      </View>
    </View>
  );
}
