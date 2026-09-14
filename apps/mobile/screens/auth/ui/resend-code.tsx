import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function ResendCode({
  secondsLeft,
  onResend,
  disabled = false,
}: {
  secondsLeft: number;
  onResend: () => void;
  disabled?: boolean;
}) {
  const ready = secondsLeft <= 0;

  return (
    <View className="items-center">
      <Pressable
        onPress={onResend}
        disabled={!ready || disabled}
        hitSlop={8}
        accessibilityRole="button"
      >
        <Text
          className={`text-[17px] font-medium ${
            ready && !disabled ? 'text-primary-500' : 'text-ink-disabled'
          }`}
        >
          Отправить код повторно
        </Text>
      </Pressable>

      {!ready ? (
        <Text className="mt-1 text-[17px] text-ink-secondary">
          {formatCountdown(secondsLeft)}
        </Text>
      ) : null}
    </View>
  );
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function useCountdown(startFrom: number) {
  const [secondsLeft, setSecondsLeft] = useState(startFrom);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setTimeout(() => setSecondsLeft((left) => left - 1), 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return { secondsLeft, restart: setSecondsLeft };
}
