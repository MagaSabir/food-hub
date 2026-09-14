import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ErrorCodes } from '@foodhubme/shared';
import { ApiError } from '@/shared/api/api-error';
import { isPhoneComplete, toE164, useRequestOtp } from '@/features/auth';
import { useFocusAfterTransition } from './lib/use-focus-after-transition';
import { AuthBackButton } from './ui/auth-back-button';
import { AuthHeading } from './ui/auth-heading';
import { PhoneField } from './ui/phone-field';
import { PrimaryButton } from './ui/primary-button';

export function PhoneScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | null>(null);
  const requestOtp = useRequestOtp();
  const inputRef = useFocusAfterTransition<TextInput>();

  const submit = () => {
    setError(null);
    Keyboard.dismiss();

    requestOtp.mutate(toE164(digits), {
      onSuccess: ({ cooldownSec }) => {
        router.push({
          pathname: '/auth/code',
          params: { digits, cooldownSec: String(cooldownSec), next },
        });
      },
      onError: (e) => setError(messageFor(e)),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-6 pb-8 pt-2"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthBackButton onPress={() => router.back()} />

          <View className="mt-10">
            <AuthHeading
              title={'Введите номер\nтелефона'}
              subtitle="Мы отправим вам код подтверждения"
            />
          </View>

          <View className="mt-10">
            <PhoneField
              ref={inputRef}
              digits={digits}
              onChangeDigits={(next) => {
                setDigits(next);
                setError(null);
              }}
            />

            {error ? (
              <Text className="mt-3 text-[15px] text-error">{error}</Text>
            ) : null}
          </View>

          <View className="mt-6">
            <PrimaryButton
              label="Продолжить"
              onPress={submit}
              disabled={!isPhoneComplete(digits)}
              loading={requestOtp.isPending}
            />
          </View>

          {}
          <Text className="mt-auto pt-10 text-center text-[13px] leading-[20px] text-ink-secondary">
            Продолжая, вы соглашаетесь{'\n'}с{' '}
            <Text className="text-primary-500">
              Пользовательским соглашением
            </Text>
            {'\n'}и{' '}
            <Text className="text-primary-500">
              Политикой конфиденциальности
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function messageFor(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.is(ErrorCodes.OTP_TOO_SOON)) {
      return 'Код уже отправлен. Подождите немного и попробуйте снова.';
    }
    if (e.is(ErrorCodes.OTP_LIMIT_EXCEEDED)) {
      return 'Слишком много запросов кода. Попробуйте через час.';
    }
    if (e.is(ErrorCodes.VALIDATION_ERROR)) {
      return 'Проверьте номер телефона.';
    }
  }

  return 'Не удалось отправить код. Проверьте связь и попробуйте ещё раз.';
}
