import { Modal, Pressable, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckIcon } from 'phosphor-react-native';
import { CatalogSort } from '@foodhubme/shared';

interface FiltersSheetProps {
  isVisible: boolean;
  sort: CatalogSort;
  onlyOpen: boolean;
  onChangeSort: (sort: CatalogSort) => void;
  onChangeOnlyOpen: (value: boolean) => void;
  onReset: () => void;
  onClose: () => void;
}

const SORTS: { value: CatalogSort; label: string; hint: string }[] = [
  { value: CatalogSort.NAME, label: 'По названию', hint: 'А → Я' },
  {
    value: CatalogSort.RATING,
    label: 'По рейтингу еды',
    hint: 'сначала лучшие',
  },
  {
    value: CatalogSort.REVIEWS,
    label: 'По количеству отзывов',
    hint: 'сначала популярные',
  },
  {
    value: CatalogSort.DELIVERY,
    label: 'По рейтингу доставки',
    hint: 'кто привозит аккуратнее',
  },
];

export function FiltersSheet({
  isVisible,
  sort,
  onlyOpen,
  onChangeSort,
  onChangeOnlyOpen,
  onReset,
  onClose,
}: FiltersSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <View
        className="rounded-t-[24px] bg-white px-5"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="items-center py-2.5">
          <View className="h-1 w-10 rounded-full bg-hairline" />
        </View>

        <View className="flex-row items-center justify-between pb-2">
          <Text className="text-[20px] font-bold text-ink">Фильтры</Text>
          <Pressable
            onPress={onReset}
            accessibilityRole="button"
            accessibilityLabel="Сбросить фильтры"
            hitSlop={8}
            className="active:opacity-60"
          >
            <Text className="text-[15px] font-medium text-primary-500">
              Сбросить
            </Text>
          </Pressable>
        </View>

        <Text className="pb-1 pt-3 text-[13px] font-semibold uppercase text-ink-secondary">
          Сортировка
        </Text>
        {SORTS.map((option) => {
          const isActive = option.value === sort;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChangeSort(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
              className="flex-row items-center gap-3 border-b border-hairline py-3 active:opacity-60"
            >
              <View className="flex-1">
                <Text className="text-[15px] text-ink">{option.label}</Text>
                <Text className="text-[12px] text-ink-secondary">
                  {option.hint}
                </Text>
              </View>
              {isActive ? (
                <CheckIcon size={20} color="#49B85D" weight="bold" />
              ) : null}
            </Pressable>
          );
        })}

        <View className="mt-4 flex-row items-center justify-between py-2">
          <View className="flex-1 pr-4">
            <Text className="text-[15px] text-ink">Только открытые</Text>
            <Text className="text-[12px] text-ink-secondary">
              Скроем тех, кто сейчас не работает
            </Text>
          </View>
          {}
          <Switch
            value={onlyOpen}
            onValueChange={onChangeOnlyOpen}
            trackColor={{ true: '#49B85D' }}
            accessibilityLabel="Только открытые сейчас"
          />
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          className="mt-4 h-13 items-center justify-center rounded-full bg-primary-500 py-3.5 active:bg-primary-700"
        >
          <Text className="text-[16px] font-bold text-white">Готово</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
