import { Fragment } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DishCard, type DishCardProps } from '@/entities/menu';
import {
  selectDishCount,
  useAddToCart,
  useCartStore,
  type CartRestaurant,
} from '@/features/cart';

export interface DishGridItem extends DishCardProps {
  hasRequiredModifiers: boolean;
}

interface DishGridProps {
  dishes: DishGridItem[];
  restaurant: CartRestaurant;
  onOpenDish: (dishId: string) => void;
}

function toRows<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

function DishCell({
  dish,
  restaurant,
  onOpenDish,
}: {
  dish: DishGridItem;
  restaurant: CartRestaurant;
  onOpenDish: (dishId: string) => void;
}) {
  const quantity = useCartStore((state) => selectDishCount(state, dish.id));
  const addToCart = useAddToCart();
  const decreaseDish = useCartStore((state) => state.decreaseDish);

  return (
    <DishCard
      {...dish}
      quantity={quantity}
      onPress={() => onOpenDish(dish.id)}
      onAdd={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (dish.hasRequiredModifiers) {
          onOpenDish(dish.id);
          return;
        }
        addToCart({
          restaurant,
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          photoUrl: dish.imageUrl,
        });
      }}
      onRemove={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        decreaseDish(dish.id);
      }}
    />
  );
}

export function DishGrid({ dishes, restaurant, onOpenDish }: DishGridProps) {
  return (
    <View className="gap-3 px-5">
      {toRows(dishes).map((row) => (
        <View key={row[0].id} className="flex-row gap-3">
          {row.map((dish) => (
            <Fragment key={dish.id}>
              <DishCell
                dish={dish}
                restaurant={restaurant}
                onOpenDish={onOpenDish}
              />
            </Fragment>
          ))}
          {}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}
