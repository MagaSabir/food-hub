import { Fragment, useEffect, useRef, useState } from 'react';
import { Animated, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  selectTotalCount,
  selectTotalPrice,
  useCartStore,
} from '@/features/cart';
import { formatPrice } from '@/shared/lib/format-price';
import { CartBar } from './ui/cart-bar';
import { DishGrid } from './ui/dish-grid';
import { InfoTiles } from './ui/info-tiles';
import { MenuTabs } from './ui/menu-tabs';
import { PhotoGalleryModal } from './ui/photo-gallery-modal';
import { RatingStrip } from './ui/rating-strip';
import {
  COVER_HEIGHT,
  RestaurantCover,
  RestaurantLogo,
} from './ui/restaurant-cover';
import { StatusBarBackdrop } from './ui/status-bar-backdrop';
import { MOCK_MENU, MOCK_RESTAURANT } from './model/mocks';

/**
 * Экран заведения: обложка → шапка с раздельными рейтингами → условия
 * (время/доставка/часы) → меню по категориям → плашка корзины.
 */
export function RestaurantScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState(MOCK_MENU[0].id);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const cartCount = useCartStore(selectTotalCount);
  const cartTotal = useCartStore(selectTotalPrice);

  // Плашка корзины выезжает справа и уходит вправо же. Держим её в дереве,
  // пока идёт анимация ухода, иначе она исчезла бы мгновенно, не доиграв.
  const { width: screenWidth } = useWindowDimensions();
  const [isCartBarMounted, setIsCartBarMounted] = useState(cartCount > 0);
  const cartSlide = useRef(new Animated.Value(cartCount > 0 ? 0 : 1)).current;

  useEffect(() => {
    if (cartCount > 0) {
      setIsCartBarMounted(true);
      // Выезд с лёгкой пружиной — «прилетело», а не «включилось».
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
      duration: 180, // уход быстрее прилёта: он уже не несёт информации
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setIsCartBarMounted(false);
    });
  }, [cartCount, cartSlide]);

  // Последние ненулевые значения: пока плашка уезжает, корзина уже пуста, и без
  // них в кадре мелькнуло бы «0 товаров на 0 ₽».
  const lastCart = useRef({ count: cartCount, total: cartTotal });
  if (cartCount > 0) lastCart.current = { count: cartCount, total: cartTotal };

  const cartSlideStyle = {
    transform: [
      {
        translateX: cartSlide.interpolate({
          inputRange: [0, 1],
          // +32 — чтобы уехала за край вместе с тенью, без «хвоста» у границы.
          outputRange: [0, screenWidth + 32],
        }),
      },
    ],
  };

  // Позиция прокрутки нужна одному: проявлению белой подложки под часами.
  const scrollY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = scrollY.interpolate({
    inputRange: [COVER_HEIGHT / 2, COVER_HEIGHT * 0.75],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View className="flex-1 bg-canvas">
      {/* Категории НЕ липкие: уезжают вместе с контентом, как чипсы кухонь на
          Главной. */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        // Оттяжка вниз включена: обложка растит фото (scale+translateY от
        // scrollY), поэтому пустоты сверху не видно — RestaurantCover.
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        <View>
          <RestaurantCover
            coverUrl={MOCK_RESTAURANT.photos[0]}
            scrollY={scrollY}
            photosCount={MOCK_RESTAURANT.photos.length}
            onPress={() => setIsGalleryOpen(true)}
          />

          {/* Белый лист заезжает на фото скруглёнными углами. */}
          <View className="-mt-6 rounded-t-[24px] bg-white px-5 pb-5">
            <View className="flex-row gap-4">
              {/* Лого поднято над листом — на фото заходит примерно треть. */}
              <View className="-mt-[44px]">
                <RestaurantLogo
                  name={MOCK_RESTAURANT.name}
                  logo={MOCK_RESTAURANT.logo}
                />
              </View>
              <View className="flex-1 pt-1">
                <Text
                  className="text-[24px] font-bold text-ink"
                  numberOfLines={1}
                >
                  {MOCK_RESTAURANT.name}
                </Text>
                <Text
                  className="mt-1 text-[13px] text-ink-secondary"
                  numberOfLines={2}
                >
                  {MOCK_RESTAURANT.cuisine}
                </Text>
              </View>
            </View>

            <RatingStrip
              ratingOverall={MOCK_RESTAURANT.ratingOverall}
              ratingFood={MOCK_RESTAURANT.ratingFood}
              ratingDelivery={MOCK_RESTAURANT.ratingDelivery}
              reviewsCount={MOCK_RESTAURANT.reviewsCount}
            />

            <InfoTiles
              deliveryTime={MOCK_RESTAURANT.deliveryTime}
              freeDeliveryFrom={MOCK_RESTAURANT.freeDeliveryFrom}
              openUntil={MOCK_RESTAURANT.openUntil}
            />
          </View>
        </View>

        <MenuTabs
          tabs={MOCK_MENU.map(({ id, title }) => ({ id, title }))}
          activeId={activeCategory}
          onChange={setActiveCategory}
        />

        <View>
          {MOCK_MENU.map((category) => (
            <Fragment key={category.id}>
              <Text className="px-5 pb-3 pt-5 text-[20px] font-bold text-ink">
                {category.title}
              </Text>
              <DishGrid dishes={category.dishes} />
            </Fragment>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Белая подложка под часами — появляется к середине фото. Лежит
          абсолютом поверх контента, поэтому ничего в потоке не сдвигает. */}
      <StatusBarBackdrop opacity={backdropOpacity} height={insets.top} />

      <PhotoGalleryModal
        photos={MOCK_RESTAURANT.photos}
        isVisible={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      {/* Плашка корзины поверх контента, над домашним индикатором.
          Пустая корзина — плашки нет: она бы просто занимала место. */}
      {isCartBarMounted ? (
        <Animated.View
          className="absolute left-0 right-0 px-4"
          style={[{ bottom: insets.bottom + 8 }, cartSlideStyle]}
        >
          <CartBar
            count={lastCart.current.count}
            total={formatPrice(lastCart.current.total)}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
