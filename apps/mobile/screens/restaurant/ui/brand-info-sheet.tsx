import { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ClockIcon,
  GiftIcon,
  MopedIcon,
  PhoneIcon,
  XIcon,
} from 'phosphor-react-native';
import type { BranchInfo, RestaurantDetails } from '@foodhubme/shared';
import { formatCuisines } from '../lib/brand-header';
import { hasAnyHours, toWeekRows } from '../lib/working-hours';
import { formatPrice } from '@/shared/lib/format-price';

interface BrandInfoSheetProps {
  visible: boolean;
  restaurant: RestaurantDetails;
  onClose: () => void;
}

export function BrandInfoSheet({
  visible,
  restaurant,
  onClose,
}: BrandInfoSheetProps) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  const branches = restaurant.branches;
  const isMultiBranch = branches.length > 1;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setSelectedId(branches[0]?.id ?? null);
  }, [visible, branches]);

  const selected = branches.find((b) => b.id === selectedId) ?? branches[0];

  const cardWidth = (width - 40 - 12) / 2;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <View
        className="rounded-t-[24px] bg-white"
        style={{ maxHeight: height * 0.88, paddingBottom: insets.bottom + 12 }}
      >
        <View className="items-center pt-2.5">
          <View className="h-1 w-10 rounded-full bg-hairline" />
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
          hitSlop={8}
          className="absolute right-5 top-5 z-10 h-11 w-11 items-center justify-center rounded-full bg-surface-2 active:opacity-70"
        >
          <XIcon size={20} color="#1D1D1F" weight="bold" />
        </Pressable>

        <ScrollView
          className="px-5"
          contentContainerStyle={{ paddingTop: 18, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="pr-14 text-[32px] font-bold leading-[38px] text-ink">
            {restaurant.name}
          </Text>

          {restaurant.cuisineTypes.length > 0 ? (
            <Text className="mt-1 text-[15px] text-ink-secondary">
              {formatCuisines(restaurant.cuisineTypes)}
            </Text>
          ) : null}

          {restaurant.description ? (
            <Text className="mt-4 text-[15px] leading-[21px] text-ink">
              {restaurant.description}
            </Text>
          ) : null}

          {branches.length === 0 ? (
            <Text className="py-8 text-center text-[14px] text-ink-secondary">
              У заведения пока не указаны точки.
            </Text>
          ) : null}

          {}
          {isMultiBranch ? (
            <View className="mt-6 flex-row items-center justify-between">
              <Text className="text-[20px] font-bold text-ink">Наши точки</Text>
              <View className="rounded-full bg-surface-2 px-3 py-1.5">
                <Text className="text-[13px] font-medium text-ink-secondary">
                  {formatBranchCount(branches.length)}
                </Text>
              </View>
            </View>
          ) : null}

          {isMultiBranch ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerStyle={{ gap: 12, alignItems: 'stretch' }}
            >
              {branches.map((branch, index) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  number={index + 1}
                  width={cardWidth}
                  isActive={branch.id === selected?.id}
                  onPress={() => setSelectedId(branch.id)}
                />
              ))}
            </ScrollView>
          ) : selected ? (
            <BranchCard branch={selected} className="mt-5" />
          ) : null}

          {selected ? (
            <>
              {}
              <Pressable
                onPress={() => {
                  void Linking.openURL(
                    `tel:${selected.phone.replace(/[^+\d]/g, '')}`,
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel={`Позвонить: ${selected.phone}`}
                className="mt-4 flex-row items-center gap-2.5 active:opacity-60"
              >
                <PhoneIcon size={20} color="#49B85D" weight="fill" />
                <Text className="text-[16px] font-medium text-primary-600">
                  {selected.phone}
                </Text>
              </Pressable>

              <WorkingHoursCard branch={selected} />
              <ConditionsCard branch={selected} />
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function formatBranchCount(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} точек`;
  if (last === 1) return `${count} точка`;
  if (last >= 2 && last <= 4) return `${count} точки`;
  return `${count} точек`;
}

function BranchCard({
  branch,
  number,
  width,
  isActive = false,
  onPress,
  className = '',
}: {
  branch: BranchInfo;
  number?: number;
  width?: number;
  isActive?: boolean;
  onPress?: () => void;
  className?: string;
}) {
  const isSelectable = onPress !== undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={!isSelectable}
      accessibilityRole={isSelectable ? 'radio' : undefined}
      accessibilityState={isSelectable ? { checked: isActive } : undefined}
      accessibilityLabel={
        number === undefined
          ? branch.address
          : `Точка ${number}: ${branch.address}`
      }
      style={width === undefined ? undefined : { width }}
      className={`rounded-[18px] border p-3 ${className} ${
        isSelectable ? 'active:opacity-70' : ''
      } ${isActive ? 'border-primary-500 bg-primary-50' : 'border-hairline'}`}
    >
      {number === undefined ? null : (
        <View
          className={`h-6 w-6 items-center justify-center rounded-full ${
            isActive ? 'bg-primary-500' : 'bg-ink-placeholder'
          }`}
        >
          <Text className="text-[12px] font-bold text-white">{number}</Text>
        </View>
      )}

      <Text
        className={`text-[15px] font-semibold text-ink ${
          number === undefined ? '' : 'mt-2'
        }`}
        numberOfLines={2}
        style={
          number === undefined ? undefined : { lineHeight: 20, minHeight: 40 }
        }
      >
        {branch.address}
      </Text>

      <Text
        className={`mt-1 text-[14px] ${
          isActive ? 'text-primary-600' : 'text-ink-secondary'
        }`}
        numberOfLines={1}
      >
        {formatBranchStatus(branch)}
      </Text>
    </Pressable>
  );
}

function formatBranchStatus(branch: BranchInfo): string {
  if (!branch.isOpen) return 'Закрыто';
  return branch.closesAt ? `Открыто до ${branch.closesAt}` : 'Открыто';
}

function WorkingHoursCard({ branch }: { branch: BranchInfo }) {
  const rows = toWeekRows(branch.workingHours);

  return (
    <View className="mt-4 rounded-[20px] border border-hairline px-4 py-3">
      <View className="flex-row items-center gap-2.5 py-1">
        <ClockIcon size={20} color="#49B85D" weight="regular" />
        <Text className="text-[17px] font-bold text-ink">Часы работы</Text>
      </View>

      {hasAnyHours(branch.workingHours) ? (
        <View className="mt-1">
          {rows.map((row, index) => (
            <View
              key={row.day}
              className={`flex-row items-center justify-between py-3 ${
                index < rows.length - 1 ? 'border-b border-hairline' : ''
              }`}
            >
              {}
              <Text
                className={`w-10 text-[15px] ${
                  row.isToday
                    ? 'font-semibold text-primary-600'
                    : 'text-ink-secondary'
                }`}
              >
                {row.label}
              </Text>

              <Text
                className={`text-[15px] ${
                  row.isToday
                    ? 'font-semibold text-primary-600'
                    : row.isClosed
                      ? 'text-ink-secondary'
                      : 'text-ink'
                }`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {row.isClosed ? 'выходной' : row.hours}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="py-2 text-[15px] text-ink-secondary">
          График не указан — уточните по телефону.
        </Text>
      )}
    </View>
  );
}

function ConditionsCard({ branch }: { branch: BranchInfo }) {
  const services = [
    branch.hasDelivery ? 'Доставка' : null,
    branch.hasPickup ? 'Самовывоз' : null,
    branch.hasDineIn ? 'В зале' : null,
  ].filter(Boolean);

  return (
    <View className="mt-4 rounded-[20px] border border-hairline p-4">
      {services.length > 0 ? (
        <View className="flex-row items-center gap-2.5">
          <MopedIcon size={20} color="#49B85D" weight="regular" />
          <Text className="flex-1 text-[17px] font-bold text-ink">
            {services.join(' · ')}
          </Text>
        </View>
      ) : null}

      <Text
        className={`text-[15px] text-ink-secondary ${
          services.length > 0 ? 'mt-2' : ''
        }`}
      >
        {conditionsLine(branch)}
      </Text>

      {}
      {showsFreeDeliveryPromo(branch) ? (
        <View className="mt-3 flex-row items-center gap-2 rounded-[14px] bg-primary-50 px-4 py-3">
          <GiftIcon size={18} color="#49B85D" weight="regular" />
          <Text className="flex-1 text-[15px] font-medium text-primary-600">
            Бесплатная доставка от {formatPrice(branch.freeDeliveryMinOrder!)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function conditionsLine(branch: BranchInfo): string {
  const parts = [`Минимальный заказ ${formatPrice(branch.minOrderAmount)}`];

  if (branch.hasDelivery) {
    parts.push(
      branch.deliveryBaseFee === 0
        ? 'Доставка бесплатно'
        : `Доставка от ${formatPrice(branch.deliveryBaseFee)}`,
    );
  }

  return parts.join(' · ');
}

function showsFreeDeliveryPromo(branch: BranchInfo): boolean {
  return (
    branch.hasDelivery &&
    branch.deliveryBaseFee > 0 &&
    branch.freeDeliveryMinOrder !== null
  );
}
