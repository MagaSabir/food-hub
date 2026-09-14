import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Animated, Pressable, Text, TextInput, View } from 'react-native';
import { OTP_CODE_LENGTH } from '@foodhubme/shared';

export interface CodeFieldRef {
  clear: () => void;
  focus: () => void;
}

export const CodeField = forwardRef<
  CodeFieldRef,
  {
    onChangeCode: (code: string) => void;
    onFilled: (code: string) => void;
    disabled?: boolean;
    invalid?: boolean;
  }
>(function CodeField(
  { onChangeCode, onFilled, disabled = false, invalid = false },
  ref,
) {
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    clear: () => {
      setCode('');
      onChangeCode('');
    },
    focus: () => inputRef.current?.focus(),
  }));

  const handleChange = (text: string) => {
    const next = text.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH);

    setCode(next);
    onChangeCode(next);

    if (next.length === OTP_CODE_LENGTH) {
      inputRef.current?.blur();
      onFilled(next);
    }
  };

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <View className="flex-row gap-3">
        {Array.from({ length: OTP_CODE_LENGTH }).map((_, index) => (
          <CodeCell
            key={index}
            char={code[index]}
            active={index === code.length && !disabled}
            invalid={invalid}
          />
        ))}
      </View>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={handleChange}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={OTP_CODE_LENGTH}
        caretHidden
        accessibilityLabel="Код из SMS"
        className="absolute inset-0 opacity-0"
      />
    </Pressable>
  );
});

function CodeCell({
  char,
  active,
  invalid,
}: {
  char?: string;
  active: boolean;
  invalid: boolean;
}) {
  return (
    <View
      className={`h-[60px] flex-1 items-center justify-center rounded-2xl border bg-white ${
        invalid
          ? 'border-error'
          : active
            ? 'border-primary-500'
            : 'border-hairline'
      }`}
    >
      {char ? (
        <Text className="text-[24px] font-semibold text-ink">{char}</Text>
      ) : active ? (
        <BlinkingCaret />
      ) : (
        <Text className="text-[20px] text-ink-placeholder">–</Text>
      )}
    </View>
  );
}

function BlinkingCaret() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className="h-7 w-[2px] rounded-full bg-primary-500"
      style={{ opacity }}
    />
  );
}
