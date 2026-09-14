import { useRef } from 'react';
import { Animated, Pressable, ScrollView, Text } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { SquaresFourIcon } from 'phosphor-react-native';

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'Пицца', label: 'Пицца', icon: require('@/assets/cuisines/pizza.png') },
  { id: 'Суши', label: 'Суши', icon: require('@/assets/cuisines/sushi.png') },
  {
    id: 'Бургеры',
    label: 'Бургеры',
    icon: require('@/assets/cuisines/burgers.png'),
  },
  {
    id: 'Завтраки',
    label: 'Завтраки',
    icon: require('@/assets/cuisines/breakfast.png'),
  },
  {
    id: 'Кофе',
    label: 'Кофе',
    icon: require('@/assets/cuisines/coffee.png'),
  },
  {
    id: 'Салаты',
    label: 'Салаты',
    icon: require('@/assets/cuisines/salad.png'),
  },
];

type Category = (typeof CATEGORIES)[number];

function CategoryChip({
  cat,
  isActive,
  onPress,
}: {
  cat: Category;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    scale.setValue(1.08);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 200,
      useNativeDriver: true,
    }).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Категория ${cat.label}`}
        accessibilityState={{ selected: isActive }}
        className={`h-[80px] w-[66px] items-center justify-center gap-1 rounded-2xl bg-white px-1.5 ${
          isActive
            ? 'border-[1.5px] border-primary-500'
            : 'border border-hairline'
        }`}
      >
        {cat.icon ? (
          <Image
            source={cat.icon}
            style={{ width: 36, height: 36 }}
            contentFit="contain"
          />
        ) : (
          <SquaresFourIcon
            size={36}
            color="#49B85D"
            weight={isActive ? 'fill' : 'regular'}
          />
        )}
        <Text
          className={`text-[11px] font-medium ${
            isActive ? 'text-primary-500' : 'text-ink'
          }`}
          numberOfLines={1}
        >
          {cat.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

interface CuisineChipsProps {
  value: string | null;
  onChange: (cuisine: string | null) => void;
}

export function CuisineChips({ value, onChange }: CuisineChipsProps) {
  const activeId = value ?? 'all';

  const handlePress = (id: string) => {
    if (id !== activeId) Haptics.selectionAsync();
    onChange(id === 'all' ? null : id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="grow-0"
      contentContainerClassName="gap-2 px-5 py-1"
    >
      {CATEGORIES.map((cat) => (
        <CategoryChip
          key={cat.id}
          cat={cat}
          isActive={cat.id === activeId}
          onPress={() => handlePress(cat.id)}
        />
      ))}
    </ScrollView>
  );
}
