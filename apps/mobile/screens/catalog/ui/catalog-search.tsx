import { Pressable, Text, View } from 'react-native';
import {
  MagnifyingGlassIcon,
  SlidersHorizontalIcon,
} from 'phosphor-react-native';
import { surfaceShadow } from '@/shared/lib/surface';

export function CatalogSearch() {
  return (
    <View className="px-5 pb-2 pt-1">
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Поиск ресторанов, блюд или кухонь"
        className="h-[50px] flex-row items-center gap-3 rounded-[18px] border border-hairline bg-white pl-4 pr-2 active:opacity-80"
        style={surfaceShadow}
      >
        <MagnifyingGlassIcon size={22} color="#6E6E73" />
        <Text className="flex-1 text-[15px] text-ink-placeholder">
          Поиск ресторанов, блюд или кухонь
        </Text>
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface-2">
          <SlidersHorizontalIcon size={20} color="#49B85D" />
        </View>
      </Pressable>
    </View>
  );
}
