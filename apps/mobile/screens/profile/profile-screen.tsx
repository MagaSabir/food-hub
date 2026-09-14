import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  CaretRightIcon,
  HeartIcon,
  MapPinIcon,
  UserIcon,
} from 'phosphor-react-native';
import {
  NameSheet,
  SignInInvite,
  formatPhone,
  useMe,
  useUpdateProfile,
} from '@/features/auth';
import { useSessionStore } from '@/entities/session';
import { router } from 'expo-router';
import { surfaceShadow } from '@/shared/lib/surface';
import { tabBarContentPadding } from '@/shared/lib/tab-bar';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const status = useSessionStore((state) => state.status);
  const signOut = useSessionStore((state) => state.signOut);
  const { data: me } = useMe();

  const [isNameOpen, setIsNameOpen] = useState(false);
  const updateProfile = useUpdateProfile();

  if (status === 'unknown') return <View className="flex-1 bg-canvas" />;

  if (status === 'guest') {
    return (
      <SignInInvite note="Войдите, чтобы сохранять адреса и видеть свои заказы" />
    );
  }

  const saveName = (name: string) => {
    if (name === me?.name) return setIsNameOpen(false);

    updateProfile.mutate({ name }, { onSuccess: () => setIsNameOpen(false) });
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: tabBarContentPadding(insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="px-6 pb-2 pt-4 text-[28px] font-bold text-ink">
          Профиль
        </Text>

        {}
        <View className="px-6">
          <Pressable
            onPress={() => setIsNameOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={
              me?.name ? `Изменить имя: ${me.name}` : 'Добавить имя'
            }
            className="mt-2 flex-row items-center gap-3 rounded-card border border-hairline bg-white px-5 py-4 active:opacity-70"
            style={surfaceShadow}
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-2">
              <UserIcon size={22} color="#49B85D" weight="fill" />
            </View>

            <View className="flex-1">
              <Text className="text-[13px] text-ink-secondary">Имя</Text>
              <Text
                className={`mt-0.5 text-[17px] font-medium ${
                  me?.name ? 'text-ink' : 'text-ink-placeholder'
                }`}
                numberOfLines={1}
              >
                {}
                {me?.name ?? 'Добавить имя'}
              </Text>
            </View>

            <CaretRightIcon size={18} color="#C7C7CC" />
          </Pressable>

          <View
            className="mt-3 rounded-card border border-hairline bg-white px-5 py-4"
            style={surfaceShadow}
          >
            <Text className="text-[13px] text-ink-secondary">Телефон</Text>
            <Text className="mt-1 text-[17px] font-medium text-ink">
              {}
              {me?.phone
                ? `+7 ${formatPhone(me.phone.replace('+7', ''))}`
                : '—'}
            </Text>
            <Text className="mt-1 text-[12px] text-ink-secondary">
              По нему вы входите — сменить его нельзя.
            </Text>
          </View>

          {}
          <Pressable
            onPress={() => router.push('/addresses')}
            accessibilityRole="button"
            className="mt-3 flex-row items-center gap-3 rounded-card border border-hairline bg-white px-5 py-4 active:opacity-70"
            style={surfaceShadow}
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-2">
              <MapPinIcon size={22} color="#49B85D" weight="fill" />
            </View>
            <Text className="flex-1 text-[17px] font-medium text-ink">
              Адреса
            </Text>
            <CaretRightIcon size={18} color="#C7C7CC" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/favorites')}
            accessibilityRole="button"
            className="mt-3 flex-row items-center gap-3 rounded-card border border-hairline bg-white px-5 py-4 active:opacity-70"
            style={surfaceShadow}
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-2">
              <HeartIcon size={22} color="#49B85D" weight="fill" />
            </View>
            <Text className="flex-1 text-[17px] font-medium text-ink">
              Избранное
            </Text>
            <CaretRightIcon size={18} color="#C7C7CC" />
          </Pressable>

          <Pressable
            onPress={signOut}
            accessibilityRole="button"
            className="mt-6 h-12 items-center justify-center rounded-2xl border border-hairline bg-white active:opacity-70"
          >
            <Text className="text-[17px] font-medium text-error">Выйти</Text>
          </Pressable>
        </View>
      </ScrollView>

      <NameSheet
        visible={isNameOpen}
        current={me?.name ?? null}
        isSaving={updateProfile.isPending}
        onSave={saveName}
        onClose={() => setIsNameOpen(false)}
      />
    </SafeAreaView>
  );
}
