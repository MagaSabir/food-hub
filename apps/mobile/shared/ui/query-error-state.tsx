import { Pressable, Text, View } from 'react-native';
import { CloudSlashIcon, WifiSlashIcon } from 'phosphor-react-native';
import { NetworkError } from '@/shared/api/network-error';
import { describeError } from '@/shared/lib/describe-error';

interface QueryErrorStateProps {
  error: unknown;
  onRetry: () => void;
  variant?: 'screen' | 'inline';
}

export function QueryErrorState({
  error,
  onRetry,
  variant = 'screen',
}: QueryErrorStateProps) {
  const { title, note, canRetry } = describeError(error);
  const isOffline = error instanceof NetworkError && error.kind === 'offline';

  const Icon = isOffline ? WifiSlashIcon : CloudSlashIcon;

  const isInline = variant === 'inline';

  return (
    <View
      className={
        isInline
          ? 'items-center px-8 py-8'
          : 'flex-1 items-center justify-center px-8'
      }
    >
      <Icon size={isInline ? 32 : 40} color="#C7C7CC" weight="bold" />

      <Text
        className={`mt-3 text-center font-bold text-ink ${
          isInline ? 'text-[15px]' : 'mt-4 text-[17px]'
        }`}
      >
        {title}
      </Text>

      <Text
        className={`mt-2 text-center leading-[22px] text-ink-secondary ${
          isInline ? 'text-[14px]' : 'text-[15px]'
        }`}
      >
        {note}
      </Text>

      {canRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          className={`rounded-full bg-primary-500 active:bg-primary-700 ${
            isInline ? 'mt-4 px-5 py-2.5' : 'mt-6 px-6 py-3'
          }`}
        >
          <Text
            className={`font-semibold text-white ${
              isInline ? 'text-[14px]' : 'text-[15px]'
            }`}
          >
            Повторить
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
