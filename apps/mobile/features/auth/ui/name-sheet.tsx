import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XIcon } from 'phosphor-react-native';

const NAME_MIN = 2;
const NAME_MAX = 50;

interface NameSheetProps {
  visible: boolean;
  current: string | null;
  isSaving: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function NameSheet({
  visible,
  current,
  isSaving,
  onSave,
  onClose,
}: NameSheetProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(current ?? '');

  useEffect(() => {
    if (visible) setName(current ?? '');
  }, [visible, current]);

  const trimmed = name.trim();
  const canSave = trimmed.length >= NAME_MIN && !isSaving;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {}
        <Pressable
          accessible={false}
          className="flex-1 bg-black/40"
          onPress={() => {
            if (Keyboard.isVisible()) Keyboard.dismiss();
            else onClose();
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            accessible={false}
            onPress={() => Keyboard.dismiss()}
            className="rounded-t-3xl bg-canvas px-5 pt-4"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[20px] font-bold text-ink">Ваше имя</Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Закрыть"
                hitSlop={10}
                className="active:opacity-60"
              >
                <XIcon size={22} color="#6E6E73" />
              </Pressable>
            </View>

            <Text className="mt-1 text-[13px] text-ink-secondary">
              Так к вам обратятся курьер и ресторан.
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Например, Магомед"
              placeholderTextColor="#A1A1A6"
              accessibilityLabel="Имя"
              maxLength={NAME_MAX}
              autoFocus
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => canSave && onSave(trimmed)}
              className="mt-4 min-h-[52px] rounded-2xl border border-hairline bg-white px-4 text-[17px] text-ink"
            />

            <Pressable
              onPress={() => onSave(trimmed)}
              disabled={!canSave}
              accessibilityRole="button"
              className={`mt-4 min-h-[52px] items-center justify-center rounded-2xl py-3 ${
                canSave
                  ? 'bg-primary-500 active:bg-primary-700'
                  : 'bg-surface-2'
              }`}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  className={`text-[17px] font-semibold ${
                    canSave ? 'text-white' : 'text-ink-placeholder'
                  }`}
                >
                  Сохранить
                </Text>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
