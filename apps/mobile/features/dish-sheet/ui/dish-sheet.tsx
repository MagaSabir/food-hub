import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MinusIcon, PlusIcon, XIcon } from 'phosphor-react-native';
import { useMenuItem } from '@/entities/menu';
import { formatPrice } from '@/shared/lib/format-price';
import {
  canSubmit,
  initSelection,
  isGroupFull,
  selectedOptions,
  toggleOption,
  unitPrice,
  type SelectedOption,
  type Selection,
} from '../lib/selection';
import { ModifierGroup } from './modifier-group';

export interface DishChoice {
  dishId: string;
  name: string;
  price: number;
  options: SelectedOption[];
  photoUrl: string | null;
  quantity: number;
}

interface DishSheetProps {
  dishId: string | null;
  onAdd: (choice: DishChoice) => void;
  onClose: () => void;
}

export function DishSheet({ dishId, onAdd, onClose }: DishSheetProps) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { data: dish, isLoading, isError, refetch } = useMenuItem(dishId);

  const [selection, setSelection] = useState<Selection>({});
  const [quantity, setQuantity] = useState(1);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!dish) return;
    setSelection(initSelection(dish.modifierGroups));
    setQuantity(1);
    setPhotoIndex(0);
  }, [dish]);

  const groups = dish?.modifierGroups ?? [];
  const chosen = useMemo(
    () => selectedOptions(groups, selection),
    [groups, selection],
  );
  const perItem = dish ? unitPrice(dish.price, chosen) : 0;
  const total = perItem * quantity;
  const isReady = dish ? canSubmit(groups, selection) : false;

  const handleAdd = () => {
    if (!dish || !isReady) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAdd({
      dishId: dish.id,
      name: dish.name,
      price: perItem,
      options: chosen,
      photoUrl: dish.photoUrl,
      quantity,
    });
    onClose();
  };

  return (
    <Modal
      visible={dishId !== null}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {}
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <View
        className="rounded-t-[24px] bg-white"
        style={{ maxHeight: height * 0.86, paddingBottom: insets.bottom + 12 }}
      >
        <View className="items-center pt-2.5">
          <View className="h-1 w-10 rounded-full bg-hairline" />
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
          hitSlop={8}
          className="absolute right-4 top-4 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 active:opacity-70"
        >
          <XIcon size={18} color="#1D1D1F" weight="bold" />
        </Pressable>

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#49B85D" />
          </View>
        ) : null}

        {isError ? (
          <View className="items-center px-8 py-16">
            <Text className="text-center text-[15px] text-ink-secondary">
              Не удалось загрузить блюдо.
            </Text>
            <Pressable
              onPress={() => void refetch()}
              accessibilityRole="button"
              className="mt-4 rounded-full bg-primary-500 px-6 py-3 active:bg-primary-700"
            >
              <Text className="text-[15px] font-semibold text-white">
                Повторить
              </Text>
            </Pressable>
          </View>
        ) : null}

        {dish ? (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {dish.photos.length > 0 ? (
                <View className="px-5 pt-2">
                  {}
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) =>
                      setPhotoIndex(
                        Math.round(
                          e.nativeEvent.contentOffset.x / (width - 40),
                        ),
                      )
                    }
                  >
                    {dish.photos.map((uri) => (
                      <Image
                        key={uri}
                        source={{ uri }}
                        style={{
                          width: width - 40,
                          height: 220,
                          borderRadius: 16,
                        }}
                        contentFit="cover"
                      />
                    ))}
                  </ScrollView>

                  {}
                  {dish.photos.length > 1 ? (
                    <View className="mt-2 flex-row justify-center gap-1.5">
                      {dish.photos.map((uri, index) => (
                        <View
                          key={uri}
                          className={`h-1.5 w-1.5 rounded-full ${
                            index === photoIndex ? 'bg-ink' : 'bg-ink-disabled'
                          }`}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View className="px-5 pt-4">
                <Text className="text-[22px] font-bold text-ink">
                  {dish.name}
                </Text>

                {}
                {[
                  dish.weight,
                  dish.volume,
                  dish.calories ? `${dish.calories} ккал` : null,
                ].filter(Boolean).length > 0 ? (
                  <Text className="mt-1 text-[13px] text-ink-secondary">
                    {[
                      dish.weight,
                      dish.volume,
                      dish.calories ? `${dish.calories} ккал` : null,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                ) : null}

                {(dish.composition ?? dish.description) ? (
                  <Text className="mt-3 text-[14px] leading-[20px] text-ink-secondary">
                    {dish.composition ?? dish.description}
                  </Text>
                ) : null}

                {groups.map((group) => (
                  <ModifierGroup
                    key={group.id}
                    group={group}
                    selectedIds={selection[group.id] ?? []}
                    isFull={isGroupFull(group, selection)}
                    onToggle={(optionId) =>
                      setSelection((current) =>
                        toggleOption(current, group, optionId),
                      )
                    }
                  />
                ))}
              </View>
            </ScrollView>

            {}
            <View className="flex-row items-center gap-3 border-t border-hairline px-5 pt-3">
              <View className="h-12 flex-row items-center rounded-full bg-surface-2">
                <Pressable
                  onPress={() => setQuantity((n) => Math.max(1, n - 1))}
                  disabled={quantity <= 1}
                  accessibilityRole="button"
                  accessibilityLabel="Меньше"
                  className={`h-12 w-11 items-center justify-center rounded-l-full active:opacity-60 ${
                    quantity <= 1 ? 'opacity-30' : ''
                  }`}
                >
                  <MinusIcon size={18} color="#1D1D1F" weight="bold" />
                </Pressable>
                <Text className="min-w-6 text-center text-[17px] font-bold text-ink">
                  {quantity}
                </Text>
                <Pressable
                  onPress={() => setQuantity((n) => n + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Больше"
                  className="h-12 w-11 items-center justify-center rounded-r-full active:opacity-60"
                >
                  <PlusIcon size={18} color="#1D1D1F" weight="bold" />
                </Pressable>
              </View>

              <Pressable
                onPress={handleAdd}
                disabled={!isReady || !dish.isAvailable}
                accessibilityRole="button"
                accessibilityLabel={`Добавить в корзину за ${formatPrice(total)}`}
                className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full ${
                  isReady && dish.isAvailable
                    ? 'bg-primary-500 active:bg-primary-700'
                    : 'bg-surface-2'
                }`}
              >
                <Text
                  className={`text-[16px] font-bold ${
                    isReady && dish.isAvailable
                      ? 'text-white'
                      : 'text-ink-secondary'
                  }`}
                >
                  {dish.isAvailable ? 'Добавить' : 'Нет в наличии'}
                </Text>
                {dish.isAvailable ? (
                  <Text
                    className={`text-[16px] font-bold ${
                      isReady ? 'text-white' : 'text-ink-secondary'
                    }`}
                  >
                    · {formatPrice(total)}
                  </Text>
                ) : null}
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}
