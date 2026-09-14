import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export function SignInInvite({ note }: { note: string }) {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center text-[22px] font-bold text-ink">
          Подтвердите номер
        </Text>
        <Text className="mt-2 text-center text-[15px] leading-[22px] text-ink-secondary">
          {note}
        </Text>

        <Pressable
          onPress={() => router.push('/auth/phone')}
          accessibilityRole="button"
          className="mt-8 h-12 items-center justify-center rounded-2xl bg-primary-500 px-8 active:bg-primary-700"
        >
          <Text className="text-[17px] font-semibold text-white">Войти</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
