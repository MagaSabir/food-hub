import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { CaretLeftIcon, InfoIcon } from 'phosphor-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorCodes } from '@foodhubme/shared';
import { mapMenuItemToCard, useBrandMenu } from '@/entities/menu';
import { useRestaurant } from '@/entities/restaurant';
import { DishSheet } from '@/features/dish-sheet';
import { ApiError } from '@/shared/api/api-error';
import {
  selectTotalCount,
  selectTotalPrice,
  useAddToCart,
  useCartStore,
} from '@/features/cart';
import { formatPrice } from '@/shared/lib/format-price';
import { describeError } from '@/shared/lib/describe-error';
import { queryFailure } from '@/shared/lib/query-failure';
import { CartBar } from './ui/cart-bar';
import { DishGrid } from './ui/dish-grid';
import { InfoTiles } from './ui/info-tiles';
import { MenuTabs } from './ui/menu-tabs';
import { PhotoGalleryModal } from './ui/photo-gallery-modal';
import { RatingStrip } from './ui/rating-strip';
import { BrandInfoSheet } from './ui/brand-info-sheet';
import {
  COVER_HEIGHT,
  RestaurantCover,
  RestaurantLogo,
} from './ui/restaurant-cover';
import { deliveryLabel } from '@/entities/restaurant';
import { ScreenLoading, ScreenMessage } from './ui/screen-state';
import { StatusBarBackdrop } from './ui/status-bar-backdrop';
import {
  averageRating,
  formatCuisines,
  formatOpenUntil,
  pickBranch,
} from './lib/brand-header';
import { PLACEHOLDER_DELIVERY_TIME } from './model/placeholders';

export function RestaurantScreen() {
  const insets = useSafeAreaInsets();
  const { slug, dish } = useLocalSearchParams<{
    slug: string;
    dish?: string;
  }>();

  const restaurantQuery = useRestaurant(slug);
  const menuQuery = useBrandMenu(slug);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [openDishId, setOpenDishId] = useState<string | null>(dish ?? null);

  const addToCart = useAddToCart();
  const cartCount = useCartStore(selectTotalCount);
  const cartTotal = useCartStore(selectTotalPrice);

  const { width: screenWidth } = useWindowDimensions();
  const [isCartBarMounted, setIsCartBarMounted] = useState(cartCount > 0);
  const cartSlide = useRef(new Animated.Value(cartCount > 0 ? 0 : 1)).current;

  useEffect(() => {
    if (cartCount > 0) {
      setIsCartBarMounted(true);
      Animated.spring(cartSlide, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
        speed: 14,
      }).start();
      return;
    }
    Animated.timing(cartSlide, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setIsCartBarMounted(false);
    });
  }, [cartCount, cartSlide]);

  const lastCart = useRef({ count: cartCount, total: cartTotal });
  if (cartCount > 0) lastCart.current = { count: cartCount, total: cartTotal };

  const cartSlideStyle = {
    transform: [
      {
        translateX: cartSlide.interpolate({
          inputRange: [0, 1],
          outputRange: [0, screenWidth + 32],
        }),
      },
    ],
  };

  const scrollY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = scrollY.interpolate({
    inputRange: [COVER_HEIGHT / 2, COVER_HEIGHT * 0.75],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const menu = useMemo(() => menuQuery.data ?? [], [menuQuery.data]);

  useEffect(() => {
    if (!activeCategory && menu.length > 0) setActiveCategory(menu[0].id);
  }, [activeCategory, menu]);

  const restaurant = restaurantQuery.data;

  if (restaurantQuery.isLoading) return <ScreenLoading />;

  if (
    restaurantQuery.error instanceof ApiError &&
    restaurantQuery.error.is(ErrorCodes.RESTAURANT_NOT_FOUND)
  ) {
    return (
      <ScreenMessage
        title="Заведение не найдено"
        subtitle="Возможно, оно закрылось или ссылка устарела."
        actionLabel="К каталогу"
        onAction={() => router.replace('/')}
      />
    );
  }

  const restaurantFailure = queryFailure(restaurantQuery);

  if (restaurantFailure || !restaurant) {
    const { title, note, canRetry } = describeError(restaurantFailure);

    return (
      <ScreenMessage
        title={title}
        subtitle={note}
        actionLabel={canRetry ? 'Повторить' : undefined}
        onAction={canRetry ? () => void restaurantQuery.refetch() : undefined}
      />
    );
  }

  const branch = pickBranch(restaurant);
  const cartRestaurant = {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
  };

  return (
    <View className="flex-1 bg-canvas">
      {}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        <View>
          <RestaurantCover
            coverUrl={restaurant.photos[0] ?? null}
            scrollY={scrollY}
            photosCount={restaurant.photos.length}
            onPress={
              restaurant.photos.length > 0
                ? () => setIsGalleryOpen(true)
                : undefined
            }
          />

          {}
          <View className="-mt-6 rounded-t-[24px] bg-white px-5 pb-5">
            <View className="flex-row gap-4">
              {}
              <View className="-mt-[44px]">
                <RestaurantLogo
                  name={restaurant.name}
                  logo={restaurant.logoUrl}
                />
              </View>
              <View className="flex-1 pt-1">
                <View className="flex-row items-center gap-2.5">
                  <Text
                    className="shrink text-[24px] font-bold text-ink"
                    numberOfLines={1}
                  >
                    {restaurant.name}
                  </Text>

                  {}
                  <Pressable
                    onPress={() => setIsInfoOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="О заведении: адрес, часы работы, условия"
                    hitSlop={10}
                    className="active:opacity-60"
                  >
                    <InfoIcon size={20} color="#8A8A8E" weight="regular" />
                  </Pressable>
                </View>
                <Text
                  className="mt-1 text-[13px] text-ink-secondary"
                  numberOfLines={2}
                >
                  {formatCuisines(restaurant.cuisineTypes)}
                </Text>
              </View>
            </View>

            <RatingStrip
              ratingOverall={averageRating(
                restaurant.ratingFood,
                restaurant.ratingDelivery,
              )}
              ratingFood={restaurant.ratingFood}
              ratingDelivery={restaurant.ratingDelivery}
              reviewsCount={restaurant.reviewsCount}
            />

            <InfoTiles
              deliveryTime={PLACEHOLDER_DELIVERY_TIME}
              delivery={deliveryLabel(
                restaurant.deliveryFeeFrom,
                restaurant.freeDeliveryFrom,
              )}
              openUntil={formatOpenUntil(branch)}
            />
          </View>
        </View>

        {menuQuery.isLoading ? (
          <View className="py-12">
            <ScreenLoading />
          </View>
        ) : null}

        {menuQuery.isError ? (
          <View className="py-12">
            <ScreenMessage
              title="Меню не загрузилось"
              actionLabel="Повторить"
              onAction={() => void menuQuery.refetch()}
            />
          </View>
        ) : null}

        {menu.length > 0 ? (
          <>
            <MenuTabs
              tabs={menu.map(({ id, name }) => ({ id, title: name }))}
              activeId={activeCategory ?? menu[0].id}
              onChange={setActiveCategory}
            />

            <View>
              {menu.map((category) => (
                <Fragment key={category.id}>
                  <Text className="px-5 pb-3 pt-5 text-[20px] font-bold text-ink">
                    {category.name}
                  </Text>
                  <DishGrid
                    dishes={category.items.map(mapMenuItemToCard)}
                    restaurant={cartRestaurant}
                    onOpenDish={setOpenDishId}
                  />
                </Fragment>
              ))}
            </View>
          </>
        ) : null}

        {}
        {!menuQuery.isLoading && !menuQuery.isError && menu.length === 0 ? (
          <View className="items-center px-8 py-12">
            <Text className="text-center text-[15px] text-ink-secondary">
              Меню пока пустое — заведение его ещё заполняет.
            </Text>
          </View>
        ) : null}
      </Animated.ScrollView>

      {}
      <StatusBarBackdrop opacity={backdropOpacity} height={insets.top} />

      {}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Назад"
        hitSlop={8}
        className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-black/45 active:opacity-70"
        style={{ top: insets.top + 8 }}
      >
        <CaretLeftIcon size={22} color="#FFFFFF" weight="bold" />
      </Pressable>

      <PhotoGalleryModal
        photos={restaurant.photos}
        isVisible={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      {}
      <BrandInfoSheet
        visible={isInfoOpen}
        restaurant={restaurant}
        onClose={() => setIsInfoOpen(false)}
      />

      {}
      <DishSheet
        dishId={openDishId}
        onAdd={(choice) => addToCart({ restaurant: cartRestaurant, ...choice })}
        onClose={() => setOpenDishId(null)}
      />

      {}
      {isCartBarMounted ? (
        <Animated.View
          className="absolute left-0 right-0 px-4"
          style={[{ bottom: insets.bottom + 8 }, cartSlideStyle]}
        >
          <CartBar
            count={lastCart.current.count}
            total={formatPrice(lastCart.current.total)}
            onPress={() => router.push('/cart')}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
