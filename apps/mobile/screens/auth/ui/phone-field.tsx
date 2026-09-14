import { forwardRef, useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  formatPhone,
  isPhoneComplete,
  stripCountryCode,
} from '@/features/auth';

export const PhoneField = forwardRef<
  TextInput,
  {
    digits: string;
    onChangeDigits: (digits: string) => void;
  }
>(function PhoneField({ digits, onChangeDigits }, ref) {
  const innerRef = useRef<TextInput>(null);

  return (
    <Pressable
      onPress={() => innerRef.current?.focus()}
      className="h-16 flex-row items-center rounded-2xl border border-hairline bg-white px-5"
    >
      <Text className="text-[20px] text-ink">+7</Text>

      <TextInput
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        value={formatPhone(digits)}
        onChangeText={(text) => onChangeDigits(stripCountryCode(text))}
        placeholder="(___) ___-__-__"
        placeholderTextColor="#A1A1A6"
        keyboardType="number-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        maxLength={isPhoneComplete(digits) ? formatPhone(digits).length : 32}
        className="ml-2 flex-1 text-[20px] text-ink"
      />
    </Pressable>
  );
});
