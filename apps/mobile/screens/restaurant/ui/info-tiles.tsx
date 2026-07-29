import { Text, View } from 'react-native';
import { ClockIcon, MopedIcon } from 'phosphor-react-native';
import { surfaceShadow } from '@/shared/lib/surface';

interface InfoTilesProps {
  /** «30–40 мин».  */
  deliveryTime: string;
  /** «990 ₽» → «Бесплатно / от 990 ₽». Null → показываем цену доставки. */
  freeDeliveryFrom?: string;
  /** «Открыто до 23:00» */
  openUntil: string;
}

function Tile({
  icon,
  title,
  subtitle,
  titleClassName = 'text-ink',
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  titleClassName?: string;
}) {
  return (
    <View
      className="flex-1 rounded-2xl border border-hairline bg-white px-2.5 py-2"
      style={surfaceShadow}
    >
      <View className="flex-row items-center justify-center gap-1.5">
        {icon}
        <Text
          className={`shrink text-[13px] font-semibold ${titleClassName}`}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      <Text
        className="mt-0.5 text-center text-[11px] text-ink-secondary"
        numberOfLines={1}
      >
        {subtitle}
      </Text>
    </View>
  );
}

/**
 * Три плитки под шапкой: сколько ждать • условия доставки • часы работы.
 * Всё, что клиент решает ДО открытия меню, — одной строкой.
 */
export function InfoTiles({
  deliveryTime,
  freeDeliveryFrom,
  openUntil,
}: InfoTilesProps) {
  return (
    <View className="mt-4 flex-row gap-2">
      <Tile
        icon={<ClockIcon size={16} color="#6E6E73" />}
        title={deliveryTime}
        subtitle="Доставим"
      />
      <Tile
        icon={
          <MopedIcon
            size={17}
            color={freeDeliveryFrom ? '#49B85D' : '#6E6E73'}
          />
        }
        title={freeDeliveryFrom ? 'Бесплатно' : 'Платная'}
        titleClassName={freeDeliveryFrom ? 'text-primary-500' : 'text-ink'}
        subtitle={freeDeliveryFrom ? `от ${freeDeliveryFrom}` : 'доставка'}
      />
      <Tile
        icon={<ClockIcon size={16} color="#6E6E73" />}
        title={openUntil}
        subtitle="Открыто"
      />
    </View>
  );
}
