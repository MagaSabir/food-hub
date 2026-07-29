import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import {
  FireIcon,
  HeartIcon,
  LeafIcon,
  MinusIcon,
  PlusIcon,
  StarIcon,
} from 'phosphor-react-native';
import { formatPrice } from '@/shared/lib/format-price';

/** Метка на фото. Данные — Этап 3: `hit`/`popular` = флаг ресторана isFeatured
 *  (заказов для настоящей статистики на старте нет), `new` = дата добавления блюда. */
export type DishBadge = 'hit' | 'popular' | 'new';

export interface DishCardProps {
  id: string;
  name: string;
  /** Состав: «Томатный соус, моцарелла, свежий базилик» — 2 строки максимум. */
  composition: string;
  /** Цена числом: форматируем сами (formatPrice), считаем — только на backend. */
  price: number;
  imageUrl?: string | null;
  badge?: DishBadge;
  isFavorite?: boolean;
  /** Сколько уже в корзине: 0 — показываем ⊕, иначе счётчик «− N +». */
  quantity?: number;
  onPress?: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
  onToggleFavorite?: () => void;
}

const BADGES: Record<DishBadge, { label: string; icon: React.ReactNode }> = {
  hit: {
    label: 'Хит',
    icon: <FireIcon size={12} color="#FF6B35" weight="fill" />,
  },
  popular: {
    label: 'Популярно',
    icon: <StarIcon size={12} color="#FFB800" weight="fill" />,
  },
  new: {
    label: 'Новинка',
    icon: <LeafIcon size={12} color="#49B85D" weight="fill" />,
  },
};

const cardShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

/**
 * Плитка блюда для сетки 2-в-ряд: крупное фото сверху (еду выбирают глазами),
 * поверх — метка слева и ♡ справа; ниже название, состав, цена и зелёный ⊕.
 * Ширину задаёт родитель (flex-1 в строке сетки).
 *
 * Реальные данные и работа кнопок — Этап 3: меню в БД (3.0–3.2),
 * избранное (3.2б), корзина (3.5). Сейчас — вёрстка на моках.
 */
export function DishCard({
  name,
  composition,
  price,
  imageUrl,
  badge,
  isFavorite = false,
  quantity = 0,
  onPress,
  onAdd,
  onRemove,
  onToggleFavorite,
}: DishCardProps) {
  const badgeData = badge ? BADGES[badge] : null;
  const priceLabel = formatPrice(price);
  const inCart = quantity > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        name,
        badgeData?.label,
        composition,
        priceLabel,
        inCart ? `в корзине ${quantity}` : null,
      ]
        .filter(Boolean)
        .join('. ')}
      className="flex-1 overflow-hidden rounded-2xl bg-white active:opacity-95"
      style={cardShadow}
    >
      <View className="h-[132px] bg-surface-2">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : null}

        {badgeData ? (
          // Тёмная подложка, а не цветная: фото у блюд разные, тёмное читается
          // на любом. Цветом отличаем только иконку.
          <View className="absolute left-2 top-2 flex-row items-center gap-1 rounded-full bg-black/65 px-2 py-1">
            {badgeData.icon}
            <Text className="text-[11px] font-semibold text-white">
              {badgeData.label}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={onToggleFavorite}
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite ? 'Убрать из избранного' : 'В избранное'
          }
          hitSlop={8}
          className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-white active:opacity-70"
        >
          <HeartIcon
            size={18}
            color={isFavorite ? '#49B85D' : '#1D1D1F'}
            weight={isFavorite ? 'fill' : 'regular'}
          />
        </Pressable>
      </View>

      <View className="px-3 pb-3 pt-2.5">
        <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>
          {name}
        </Text>
        {/* Две строки состава держим ВСЕГДА (minHeight), иначе плитки в ряду
            разъезжаются по высоте: у одной состав в строку, у другой в две. */}
        <Text
          className="mt-1 min-h-[36px] text-[12px] leading-[18px] text-ink-secondary"
          numberOfLines={2}
        >
          {composition}
        </Text>

        {/* Место под угловую кнопку: цену прижимаем влево и оставляем ей
            коридор справа, иначе длинная цена уедет под кнопку. */}
        <View className="mt-2 h-11 justify-center pr-[72px]">
          <Text className="text-[17px] font-bold text-ink" numberOfLines={1}>
            {priceLabel}
          </Text>
        </View>
      </View>

      {/* Кнопка ВРОСЛА в угол плитки: занимает его целиком, скругление сверху
          слева, снизу справа углы срезает сама карточка (overflow-hidden).
          Так у неё нет «полей» — палец бьёт по краю карточки и всё равно
          попадает, а по площади это заметно больше свободного кружка. */}
      {inCart ? (
        <View className="absolute bottom-0 right-0 h-11 flex-row items-center rounded-tl-2xl bg-primary-500">
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Убрать одну штуку «${name}»`}
            className="h-11 w-10 items-center justify-center rounded-tl-2xl active:bg-primary-700"
          >
            <MinusIcon size={18} color="#FFFFFF" weight="bold" />
          </Pressable>
          <Text className="min-w-5 text-center text-[15px] font-bold text-white">
            {quantity}
          </Text>
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={`Добавить ещё одну «${name}»`}
            className="h-11 w-10 items-center justify-center active:bg-primary-700"
          >
            <PlusIcon size={18} color="#FFFFFF" weight="bold" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={`Добавить «${name}» в корзину`}
          className="absolute bottom-0 right-0 h-11 w-14 items-center justify-center rounded-tl-2xl bg-primary-500 active:bg-primary-700"
        >
          <PlusIcon size={24} color="#FFFFFF" weight="bold" />
        </Pressable>
      )}
    </Pressable>
  );
}
