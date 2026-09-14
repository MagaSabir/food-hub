import { Text, View } from 'react-native';
import { CheckIcon, XCircleIcon } from 'phosphor-react-native';
import { OrderStatus, OrderType } from '@foodhubme/shared';
import { currentStepIndex, trackerSteps } from '../lib/steps';

interface Props {
  status: OrderStatus;
  orderType: OrderType;
  prepMinutes: number | null;
  cancelReason: string | null;
}

export function OrderStatusTracker({
  status,
  orderType,
  prepMinutes,
  cancelReason,
}: Props) {
  if (status === OrderStatus.CANCELLED) {
    return (
      <View className="flex-row items-start gap-3 rounded-[20px] bg-white p-4">
        <XCircleIcon size={26} color="#EB5757" weight="fill" />
        <View className="flex-1">
          <Text className="text-[17px] font-semibold text-error">
            Заказ отменён
          </Text>
          {cancelReason ? (
            <Text className="mt-1 text-[14px] text-ink-secondary">
              {cancelReason}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  const steps = trackerSteps(orderType);
  const current = currentStepIndex(steps, status);
  const isDone = status === OrderStatus.COMPLETED;

  return (
    <View className="rounded-[20px] bg-white p-4">
      <Text className="text-[17px] font-semibold text-ink">
        {headline(status, orderType)}
      </Text>

      {}
      {prepMinutes !== null && !isDone ? (
        <Text className="mt-1 text-[14px] text-ink-secondary">
          Ресторан обещает за {prepMinutes} мин
        </Text>
      ) : null}

      <View className="mt-4 flex-row">
        {steps.map((step, index) => {
          const passed = index < current;
          const active = index === current;

          return (
            <View key={step.key} className="flex-1 items-center">
              {}
              <View className="h-6 w-full flex-row items-center">
                <View
                  className={`h-[2px] flex-1 ${
                    index === 0
                      ? 'bg-transparent'
                      : passed || active
                        ? 'bg-primary-500'
                        : 'bg-hairline'
                  }`}
                />
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full ${
                    passed
                      ? 'bg-primary-500'
                      : active
                        ? 'bg-primary-500'
                        : 'bg-surface-2'
                  }`}
                >
                  {passed ? (
                    <CheckIcon size={14} color="#FFFFFF" weight="bold" />
                  ) : (
                    <View
                      className={`h-2 w-2 rounded-full ${
                        active ? 'bg-white' : 'bg-ink-disabled'
                      }`}
                    />
                  )}
                </View>
                <View
                  className={`h-[2px] flex-1 ${
                    index === steps.length - 1
                      ? 'bg-transparent'
                      : passed
                        ? 'bg-primary-500'
                        : 'bg-hairline'
                  }`}
                />
              </View>

              <Text
                className={`mt-2 text-center text-[11px] ${
                  passed || active
                    ? 'font-semibold text-ink'
                    : 'text-ink-placeholder'
                }`}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function headline(status: OrderStatus, orderType: OrderType): string {
  const isDelivery = orderType === OrderType.DELIVERY;

  switch (status) {
    case OrderStatus.PENDING:
      return 'Ждём подтверждения ресторана';
    case OrderStatus.ACCEPTED:
    case OrderStatus.PREPARING:
      return 'Ресторан готовит ваш заказ';
    case OrderStatus.READY:
      return isDelivery ? 'Готов, ждёт курьера' : 'Готов — можно забирать';
    case OrderStatus.ON_THE_WAY:
      return 'Курьер везёт заказ';
    case OrderStatus.COMPLETED:
      return isDelivery ? 'Заказ доставлен' : 'Заказ выдан';
    case OrderStatus.CANCELLED:
      return 'Заказ отменён';
  }
}
