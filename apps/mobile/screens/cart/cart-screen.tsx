import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  CaretLeftIcon,
  TrashIcon,
  WarningCircleIcon,
} from 'phosphor-react-native';
import { OrderType } from '@foodhubme/shared';
import { useDeliveryQuote } from '@/entities/order';
import { useRestaurant } from '@/entities/restaurant';
import { AddressSheet, useAddressStore } from '@/features/address-input';
import { useSessionStore } from '@/entities/session';
import { selectTotalPrice, useCartStore } from '@/features/cart';
import { toCreateOrderRequest, usePlaceOrder } from '@/features/place-order';
import { formatPrice } from '@/shared/lib/format-price';
import { blockReasonText } from './lib/block-reason';
import { buildQuoteRequest } from './lib/quote-request';
import { BranchSheet } from './ui/branch-sheet';
import { CartLineRow } from './ui/cart-line-row';
import { CartSummary } from './ui/cart-summary';
import { DeliveryAddressCard } from './ui/delivery-address-card';
import { FreeDeliveryProgress } from './ui/free-delivery-progress';
import { OrderCommentCard } from './ui/order-comment-card';
import { OrderTypeSwitch } from './ui/order-type-switch';
import { PickupPointCard } from './ui/pickup-point-card';

const ORDER_TYPES = [
  OrderType.DELIVERY,
  OrderType.PICKUP,
  OrderType.DINE_IN,
] as const;

export function CartScreen() {
  const insets = useSafeAreaInsets();
  const linesMap = useCartStore((state) => state.lines);
  const lines = useMemo(
    () => Object.values(linesMap).sort((a, b) => a.addedAt - b.addedAt),
    [linesMap],
  );
  const localTotal = useCartStore(selectTotalPrice);
  const restaurant = useCartStore((state) => state.restaurant);
  const increaseLine = useCartStore((state) => state.increaseLine);
  const decreaseLine = useCartStore((state) => state.decreaseLine);
  const clear = useCartStore((state) => state.clear);

  const { data: brand } = useRestaurant(restaurant?.slug ?? '');
  const branches = useMemo(() => brand?.branches ?? [], [brand]);

  const [orderType, setOrderType] = useState<OrderType>(OrderType.PICKUP);
  const [chosenBranchId, setChosenBranchId] = useState<string | null>(null);
  const [isBranchSheetOpen, setBranchSheetOpen] = useState(false);
  const [isAddressSheetOpen, setAddressSheetOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const authStatus = useSessionStore((state) => state.status);
  const isGuest = authStatus === 'guest';
  const isAuthPending = authStatus === 'unknown';
  const placeOrder = usePlaceOrder();

  const address = useAddressStore((state) => state.address);
  const setAddress = useAddressStore((state) => state.setAddress);

  const available = useMemo(
    () => ({
      [OrderType.DELIVERY]: branches.some((b) => b.hasDelivery),
      [OrderType.PICKUP]: branches.some((b) => b.hasPickup),
      [OrderType.DINE_IN]: branches.some((b) => b.hasDineIn),
    }),
    [branches],
  );

  useEffect(() => {
    if (branches.length === 0 || available[orderType]) return;
    const fallback = ORDER_TYPES.find((type) => available[type]);
    if (fallback) setOrderType(fallback);
  }, [available, branches.length, orderType]);

  const suitable = useMemo(
    () =>
      branches.filter((branch) =>
        orderType === OrderType.DINE_IN ? branch.hasDineIn : branch.hasPickup,
      ),
    [branches, orderType],
  );

  const branch =
    suitable.find((b) => b.id === chosenBranchId) ??
    suitable.find((b) => b.isOpen) ??
    suitable[0] ??
    null;

  const request = useMemo(
    () =>
      buildQuoteRequest({
        restaurantId: restaurant?.id,
        orderType,
        branchId: branch?.id ?? null,
        address,
        lines,
      }),
    [restaurant?.id, orderType, branch?.id, address, lines],
  );

  const {
    data: quote,
    isFetching,
    error,
    refetch: refetchQuote,
  } = useDeliveryQuote(request);

  const isDelivery = orderType === OrderType.DELIVERY;
  const blockText = quote ? blockReasonText(quote, orderType) : null;
  const errorText = error ? error.message : null;
  const canSubmit = quote?.canOrder === true;
  const needsAddress = isDelivery && address === null;

  const ctaLabel = needsAddress
    ? 'Указать адрес'
    : isGuest
      ? 'Войти и оформить'
      : 'Оформить заказ';
  const isBlocked = !needsAddress && !isGuest && (!canSubmit || isAuthPending);
  const showTotalInCta = !needsAddress;

  useEffect(() => setSubmitError(null), [request]);

  const onClear = () => {
    Alert.alert('Очистить корзину?', 'Все добавленные блюда пропадут.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Очистить', style: 'destructive', onPress: clear },
    ]);
  };

  const onSubmit = () => {
    if (needsAddress) {
      setAddressSheetOpen(true);
      return;
    }

    if (isGuest) {
      router.push({ pathname: '/auth/phone', params: { next: 'cart' } });
      return;
    }

    if (isAuthPending) return;

    if (request === null || !canSubmit) return;

    setSubmitError(null);
    placeOrder.mutate(toCreateOrderRequest(request, comment), {
      onSuccess: (order) => {
        router.replace({
          pathname: '/order/[id]',
          params: { id: order.id, created: '1' },
        });
        clear();
      },
      onError: (e) => {
        setSubmitError(e.message);
        void refetchQuote();
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-1">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Назад"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
        >
          <CaretLeftIcon size={24} color="#1D1D1F" weight="bold" />
        </Pressable>

        <View className="flex-1">
          <Text className="text-[24px] font-bold text-ink">Корзина</Text>
          {}
          {restaurant ? (
            <Text className="text-[13px] text-ink-secondary" numberOfLines={1}>
              {restaurant.name}
            </Text>
          ) : null}
        </View>

        {lines.length > 0 ? (
          <Pressable
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel="Очистить корзину"
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full border border-hairline bg-white active:opacity-60"
          >
            <TrashIcon size={18} color="#1D1D1F" />
          </Pressable>
        ) : null}
      </View>

      {lines.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[17px] font-semibold text-ink">
            Корзина пуста
          </Text>
          <Text className="mt-2 text-center text-[14px] text-ink-secondary">
            Выберите блюда — они появятся здесь.
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            className="mt-5 rounded-full bg-primary-500 px-6 py-3 active:bg-primary-700"
          >
            <Text className="text-[15px] font-semibold text-white">
              Вернуться к меню
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-3 px-4 pb-4">
              {}
              {isDelivery && quote && quote.amountToFreeDelivery !== null ? (
                <FreeDeliveryProgress
                  itemsTotal={quote.itemsTotal}
                  amountToFreeDelivery={quote.amountToFreeDelivery}
                />
              ) : null}

              <OrderTypeSwitch
                value={orderType}
                onChange={setOrderType}
                available={available}
              />

              {isDelivery ? (
                <DeliveryAddressCard
                  address={address}
                  onPress={() => setAddressSheetOpen(true)}
                />
              ) : (
                <PickupPointCard
                  branch={branch}
                  canChange={suitable.length > 1}
                  onChange={() => setBranchSheetOpen(true)}
                />
              )}
            </View>

            <View className="px-4">
              {lines.map((line) => (
                <CartLineRow
                  key={line.id}
                  line={line}
                  onIncrease={() => increaseLine(line.id)}
                  onDecrease={() => decreaseLine(line.id)}
                />
              ))}
            </View>

            <View className="px-4 pt-3">
              <OrderCommentCard value={comment} onChange={setComment} />
            </View>

            <CartSummary
              quote={quote}
              orderType={orderType}
              localTotal={localTotal}
              isLoading={isFetching}
            />
          </ScrollView>

          <View
            className="border-t border-hairline bg-white px-4 pt-3"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            {}
            {(submitError ?? blockText ?? errorText) ? (
              <View className="mb-3 flex-row items-start gap-2 rounded-[16px] bg-surface-2 p-3">
                <WarningCircleIcon size={20} color="#EB5757" weight="fill" />
                <Text className="flex-1 text-[14px] text-ink">
                  {submitError ?? blockText ?? errorText}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={onSubmit}
              disabled={isBlocked || placeOrder.isPending}
              accessibilityRole="button"
              accessibilityLabel={`${ctaLabel} на ${formatPrice(quote?.total ?? localTotal)}`}
              className={`h-14 flex-row items-center justify-center gap-2 rounded-full ${
                isBlocked
                  ? 'bg-ink-disabled'
                  : 'bg-primary-500 active:bg-primary-700'
              }`}
            >
              {placeOrder.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-[17px] font-bold text-white">
                    {ctaLabel}
                  </Text>
                  {showTotalInCta ? (
                    <Text className="text-[17px] font-bold text-white">
                      · {formatPrice(quote?.total ?? localTotal)}
                    </Text>
                  ) : null}
                </>
              )}
            </Pressable>

            <Text className="mt-2 text-center text-[12px] text-ink-secondary">
              Наличными при получении
            </Text>
          </View>
        </>
      )}

      <BranchSheet
        visible={isBranchSheetOpen}
        branches={suitable}
        selectedId={branch?.id ?? null}
        onSelect={setChosenBranchId}
        onClose={() => setBranchSheetOpen(false)}
      />

      <AddressSheet
        visible={isAddressSheetOpen}
        current={address}
        onSave={setAddress}
        onClose={() => setAddressSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
