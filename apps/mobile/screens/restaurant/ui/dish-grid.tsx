import { Fragment } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useCartStore } from '@/features/cart';
import { DishCard, type DishCardProps } from '@/entities/menu/ui/dish-card';

interface DishGridProps {
  dishes: DishCardProps[];
}

/** Разбивка на строки по 2: [1,2,3] → [[1,2],[3]]. */
function toRows<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

/**
 * Сетка блюд 2-в-ряд. Строим строками вручную, а не FlatList с numColumns:
 * список лежит внутри общего ScrollView экрана, вложенный VirtualizedList
 * ломает скролл и ругается в консоль.
 *
 * Здесь же связь с корзиной: карточка остаётся «глупой» (только вид), а знание
 * о сторе живёт в слое экрана.
 */
export function DishGrid({ dishes }: DishGridProps) {
  const lines = useCartStore((state) => state.lines);
  const addDish = useCartStore((state) => state.addDish);
  const decreaseDish = useCartStore((state) => state.decreaseDish);

  return (
    <View className="gap-3 px-5">
      {toRows(dishes).map((row) => (
        <View key={row[0].id} className="flex-row gap-3">
          {row.map((dish) => (
            <Fragment key={dish.id}>
              <DishCard
                {...dish}
                quantity={lines[dish.id]?.quantity ?? 0}
                onAdd={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  addDish({ id: dish.id, name: dish.name, price: dish.price });
                }}
                onRemove={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  decreaseDish(dish.id);
                }}
              />
            </Fragment>
          ))}
          {/* Нечётное число блюд: пустышка, иначе одинокая плитка
              растянется на всю ширину. */}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}
