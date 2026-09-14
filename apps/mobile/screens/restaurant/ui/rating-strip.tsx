import { Text, View } from 'react-native';
import {
  ChatCircleTextIcon,
  ForkKnifeIcon,
  StarIcon,
  TruckIcon,
} from 'phosphor-react-native';

interface RatingStripProps {
  ratingOverall: number;
  ratingFood: number;
  ratingDelivery: number;
  reviewsCount: number;
}

function formatCount(n: number): string {
  return n.toLocaleString('ru-RU').replace(/ /g, ' ');
}

function RatingCell({
  value,
  label,
  icon,
  isPrimary = false,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
  isPrimary?: boolean;
}) {
  return (
    <View
      className={`flex-1 items-center rounded-2xl py-1.5 ${
        isPrimary ? 'bg-surface-2' : ''
      }`}
    >
      <View className="flex-row items-center gap-1">
        {icon}
        <Text
          className={
            isPrimary
              ? 'text-[19px] font-extrabold text-ink'
              : 'text-[15px] font-bold text-ink'
          }
        >
          {value}
        </Text>
      </View>
      <Text
        className={`mt-0.5 text-[11px] ${
          isPrimary ? 'font-semibold text-ink' : 'text-ink-secondary'
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export function RatingStrip({
  ratingOverall,
  ratingFood,
  ratingDelivery,
  reviewsCount,
}: RatingStripProps) {
  if (reviewsCount === 0) {
    return (
      <View className="mt-4 flex-row items-center justify-center rounded-2xl bg-surface-2 py-3">
        <StarIcon size={16} color="#A1A1A6" />
        <Text className="ml-2 text-[13px] text-ink-secondary">
          Пока нет отзывов
        </Text>
      </View>
    );
  }

  return (
    <View
      className="mt-4 flex-row items-center"
      accessibilityLabel={
        `Оценки: общая ${ratingOverall.toFixed(1)}, ` +
        `еда ${ratingFood.toFixed(1)}, доставка ${ratingDelivery.toFixed(1)}, ` +
        `${formatCount(reviewsCount)} отзывов`
      }
    >
      <RatingCell
        value={ratingOverall.toFixed(1)}
        label="Общий"
        icon={<StarIcon size={18} color="#FFB800" weight="fill" />}
        isPrimary
      />
      <View className="mx-0.5 h-8 w-px bg-hairline" />
      <RatingCell
        value={ratingFood.toFixed(1)}
        label="Еда"
        icon={<ForkKnifeIcon size={14} color="#49B85D" weight="bold" />}
      />
      <View className="h-8 w-px bg-hairline" />
      <RatingCell
        value={ratingDelivery.toFixed(1)}
        label="Доставка"
        icon={<TruckIcon size={14} color="#49B85D" weight="bold" />}
      />
      <View className="h-8 w-px bg-hairline" />
      <RatingCell
        value={formatCount(reviewsCount)}
        label="отзывов"
        icon={<ChatCircleTextIcon size={14} color="#6E6E73" weight="fill" />}
      />
    </View>
  );
}
