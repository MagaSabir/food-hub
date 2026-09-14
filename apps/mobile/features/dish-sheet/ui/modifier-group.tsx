import { Pressable, Text, View } from 'react-native';
import { CheckIcon } from 'phosphor-react-native';
import {
  ModifierType,
  type ModifierOptionInfo,
  type ModifierGroupInfo,
} from '@foodhubme/shared';
import { formatPrice } from '@/shared/lib/format-price';

interface ModifierGroupProps {
  group: ModifierGroupInfo;
  selectedIds: string[];
  isFull: boolean;
  onToggle: (optionId: string) => void;
}

function groupHint(group: ModifierGroupInfo): string | null {
  if (group.isRequired) return 'Обязательно';
  if (group.type === ModifierType.MULTIPLE && group.maxSelections !== null) {
    return `До ${group.maxSelections}`;
  }
  if (group.minSelections > 0) return `Минимум ${group.minSelections}`;
  return null;
}

function priceDeltaText(option: ModifierOptionInfo): string | null {
  if (option.priceDelta === 0) return null;
  const sign = option.priceDelta > 0 ? '+' : '−';
  return `${sign}${formatPrice(Math.abs(option.priceDelta))}`;
}

export function ModifierGroup({
  group,
  selectedIds,
  isFull,
  onToggle,
}: ModifierGroupProps) {
  const hint = groupHint(group);
  const isSingle = group.type === ModifierType.SINGLE;

  const left =
    group.maxSelections === null
      ? null
      : group.maxSelections - selectedIds.length;

  return (
    <View className="mt-6">
      <View className="flex-row items-center gap-2">
        <Text className="text-[17px] font-bold text-ink">{group.name}</Text>
        {hint ? (
          <Text
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              group.isRequired
                ? 'bg-primary-50 text-primary-700'
                : 'bg-surface-2 text-ink-secondary'
            }`}
          >
            {hint}
          </Text>
        ) : null}
      </View>

      {isSingle ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {group.options.map((option) => {
            const isSelected = selectedIds.includes(option.id);
            const isDisabled = !option.isAvailable || (isFull && !isSelected);
            const delta = priceDeltaText(option);

            return (
              <Pressable
                key={option.id}
                onPress={() => onToggle(option.id)}
                disabled={isDisabled}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: isSelected,
                  disabled: isDisabled,
                }}
                accessibilityLabel={[
                  option.name,
                  delta,
                  option.isAvailable ? null : 'нет в наличии',
                ]
                  .filter(Boolean)
                  .join(', ')}
                style={{ width: '48.5%' }}
                className={`flex-row items-center gap-2 rounded-[16px] border p-3 active:opacity-70 ${
                  isSelected ? 'border-primary-500' : 'border-hairline'
                } ${isDisabled ? 'opacity-40' : ''}`}
              >
                <View className="flex-1">
                  <Text
                    className="text-[15px] font-semibold text-ink"
                    numberOfLines={1}
                  >
                    {option.name}
                  </Text>
                  <Text
                    className="mt-0.5 text-[13px] text-ink-secondary"
                    numberOfLines={1}
                  >
                    {option.isAvailable ? (delta ?? 'без доплаты') : 'нет'}
                  </Text>
                </View>

                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                    isSelected ? 'border-primary-500' : 'border-hairline'
                  }`}
                >
                  {isSelected ? (
                    <View className="h-3 w-3 rounded-full bg-primary-500" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View className="mt-2 overflow-hidden rounded-[16px] border border-hairline">
          {group.options.map((option, index) => {
            const isSelected = selectedIds.includes(option.id);
            const isDisabled = !option.isAvailable || (isFull && !isSelected);
            const delta = priceDeltaText(option);
            const isLast = index === group.options.length - 1;

            return (
              <Pressable
                key={option.id}
                onPress={() => onToggle(option.id)}
                disabled={isDisabled}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: isSelected,
                  disabled: isDisabled,
                }}
                accessibilityLabel={[
                  option.name,
                  delta,
                  option.isAvailable ? null : 'нет в наличии',
                ]
                  .filter(Boolean)
                  .join(', ')}
                className={`flex-row items-center gap-3 px-3 py-3 active:opacity-60 ${
                  isLast ? '' : 'border-b border-hairline'
                } ${isDisabled ? 'opacity-40' : ''}`}
              >
                <Text className="flex-1 text-[15px] text-ink" numberOfLines={1}>
                  {option.name}
                  {option.isAvailable ? '' : ' — нет'}
                </Text>

                {}
                {delta ? (
                  <Text className="text-[15px] font-semibold text-ink-secondary">
                    {delta}
                  </Text>
                ) : null}

                <View
                  className={`h-6 w-6 items-center justify-center rounded-md border-2 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-hairline'
                  }`}
                >
                  {isSelected ? (
                    <CheckIcon size={14} color="#FFFFFF" weight="bold" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {}
      {!isSingle && left !== null && selectedIds.length > 0 ? (
        <Text className="mt-2 rounded-[12px] bg-primary-50 px-3 py-2 text-[13px] text-primary-700">
          {left > 0
            ? `Можно выбрать ещё ${left}`
            : 'Выбрано максимум — снимите один, чтобы поменять'}
        </Text>
      ) : null}
    </View>
  );
}
