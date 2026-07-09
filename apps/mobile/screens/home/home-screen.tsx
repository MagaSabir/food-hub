import { Button, Text, View } from 'react-native';

export function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6 dark:bg-neutral-900">
      <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
        FoodHub
      </Text>
      <Text className="mt-2 text-center text-neutral-500 dark:text-neutral-400">
        Каркас готов. Экраны — со следующего этапа.
      </Text>
      <Button title="Press me" />
    </View>
  );
}
