import { Text, View } from 'react-native';
import { ClockIcon, MopedIcon } from 'phosphor-react-native';
import { surfaceShadow } from '@/shared/lib/surface';
import type { DeliveryLabel } from '@/entities/restaurant';

interface InfoTilesProps {
  deliveryTime: string;
  delivery: DeliveryLabel;
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

export function InfoTiles({
  deliveryTime,
  delivery,
  openUntil,
}: InfoTilesProps) {
  return (
    <View className="mt-4 flex-row gap-2">
      {}
      <Tile
        icon={<ClockIcon size={16} color="#6E6E73" />}
        title={deliveryTime}
        subtitle="Доставим"
      />
      <Tile
        icon={
          <MopedIcon
            size={17}
            color={delivery.accent ? '#49B85D' : '#6E6E73'}
          />
        }
        title={delivery.title}
        titleClassName={delivery.accent ? 'text-primary-500' : 'text-ink'}
        subtitle={delivery.subtitle}
      />
      <Tile
        icon={<ClockIcon size={16} color="#6E6E73" />}
        title={openUntil}
        subtitle="Открыто"
      />
    </View>
  );
}
