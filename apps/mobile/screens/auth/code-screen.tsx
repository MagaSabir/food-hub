import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ErrorCodes } from '@foodhubme/shared';
import { ApiError } from '@/shared/api/api-error';
import {
  formatPhone,
  toE164,
  useRequestOtp,
  useVerifyOtp,
} from '@/features/auth';
import { useFocusAfterTransition } from './lib/use-focus-after-transition';
import { AuthBackButton } from './ui/auth-back-button';
import { AuthHeading } from './ui/auth-heading';
import { CodeField, type CodeFieldRef } from './ui/code-field';
import { ResendCode, useCountdown } from './ui/resend-code';

export function CodeScreen() {
  const params = useLocalSearchParams<{
    digits: string;
    cooldownSec: string;
    next?: string;
  }>();
  const digits = params.digits ?? '';

  const [error, setError] = useState<string | null>(null);
  const [dead, setDead] = useState(false);

  const codeRef = useFocusAfterTransition<CodeFieldRef>();
  const { secondsLeft, restart } = useCountdown(
    Number(params.cooldownSec) || 0,
  );
  const verifyOtp = useVerifyOtp();
  const requestOtp = useRequestOtp();

  const resetCode = () => {
    codeRef.current?.clear();
    codeRef.current?.focus();
  };

  const submit = (value: string) => {
    setError(null);
    Keyboard.dismiss();

    verifyOtp.mutate(
      { phone: toE164(digits), code: value },
      {
        onSuccess: () =>
          router.replace(params.next === 'cart' ? '/cart' : '/(tabs)'),
        onError: (e) => {
          setError(messageFor(e));

          if (e instanceof ApiError && e.is(ErrorCodes.OTP_ATTEMPTS_EXCEEDED)) {
            codeRef.current?.clear();
            setDead(true);
            return;
          }

          resetCode();
        },
      },
    );
  };

  const resend = () => {
    setError(null);

    requestOtp.mutate(toE164(digits), {
      onSuccess: ({ cooldownSec }) => {
        setDead(false);
        restart(cooldownSec);
        resetCode();
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
              title={'Введите код\nиз SMS'}
              subtitle={`Код отправлен на номер\n+7 ${formatPhone(digits)}`}
            />
          </View>

          <View className="mt-10">
            <CodeField
              ref={codeRef}
              onChangeCode={() => setError(null)}
              onFilled={(code) => {
                if (!dead) submit(code);
              }}
              disabled={verifyOtp.isPending || dead}
              invalid={Boolean(error)}
            />

            {error ? (
              <Text className="mt-4 text-center text-[15px] text-error">
                {error}
              </Text>
            ) : null}
          </View>

          <View className="mt-8">
            <ResendCode
              secondsLeft={secondsLeft}
              onResend={resend}
              disabled={requestOtp.isPending || verifyOtp.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function messageFor(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.is(ErrorCodes.INVALID_OTP))
      return 'Неверный код. Попробуйте ещё раз.';
    if (e.is(ErrorCodes.OTP_ATTEMPTS_EXCEEDED)) {
      return 'Слишком много попыток. Запросите код заново.';
    }
    if (e.is(ErrorCodes.OTP_TOO_SOON)) {
      return 'Код уже отправлен. Подождите таймер.';
    }
    if (e.is(ErrorCodes.OTP_LIMIT_EXCEEDED)) {
      return 'Слишком много запросов кода. Попробуйте через час.';
    }
  }

  return 'Не удалось проверить код. Проверьте связь и попробуйте ещё раз.';
}
