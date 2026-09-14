import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XIcon } from 'phosphor-react-native';
import type { BranchInfo } from '@foodhubme/shared';

interface BranchSheetProps {
  visible: boolean;
  branches: BranchInfo[];
  selectedId: string | null;
  onSelect: (branchId: string) => void;
  onClose: () => void;
}

export function BranchSheet({
  visible,
  branches,
  selectedId,
  onSelect,
  onClose,
}: BranchSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [draftId, setDraftId] = useState<string | null>(selectedId);

  useEffect(() => {
    if (visible) setDraftId(selectedId);
  }, [visible, selectedId]);

  const confirm = () => {
    if (draftId) onSelect(draftId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <View
        className="rounded-t-[24px] bg-white"
        style={{ maxHeight: height * 0.86, paddingBottom: insets.bottom + 12 }}
      >
        <View className="items-center pt-2.5">
          <View className="h-1 w-10 rounded-full bg-hairline" />
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
          hitSlop={8}
          className="absolute right-4 top-4 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 active:opacity-70"
        >
          <XIcon size={18} color="#1D1D1F" weight="bold" />
        </Pressable>

        <Text className="px-5 pt-4 text-[24px] font-bold text-ink">
          Выберите точку
        </Text>

        <ScrollView
          className="mt-4 px-5"
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {branches.map((branch) => {
            const isChosen = branch.id === draftId;
            const isDisabled = !branch.isOpen;

            return (
              <Pressable
                key={branch.id}
                onPress={() => setDraftId(branch.id)}
                disabled={isDisabled}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: isChosen,
                  disabled: isDisabled,
                }}
                className={`mb-3 flex-row items-center gap-3 rounded-[20px] border p-4 ${
                  isChosen ? 'border-primary-500' : 'border-hairline'
                } ${isDisabled ? 'opacity-50' : ''}`}
              >
                <View className="flex-1">
                  <Text className="text-[17px] font-semibold text-ink">
                    {branch.name ?? branch.address}
                  </Text>
                  {branch.name ? (
                    <Text className="mt-1 text-[14px] text-ink-secondary">
                      {branch.address}
                    </Text>
                  ) : null}
                  <Text className="mt-1 text-[14px] text-ink-secondary">
                    {branch.isOpen
                      ? branch.closesAt
                        ? `Открыто до ${branch.closesAt}`
                        : 'Открыто'
                      : 'Сегодня закрыто'}
                  </Text>
                </View>

                {}
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                    isChosen ? 'border-primary-500' : 'border-hairline'
                  }`}
                >
                  {isChosen ? (
                    <View className="h-3 w-3 rounded-full bg-primary-500" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="px-5 pt-1">
          <Pressable
            onPress={confirm}
            disabled={draftId === null}
            accessibilityRole="button"
            className={`h-14 items-center justify-center rounded-full ${
              draftId === null
                ? 'bg-ink-disabled'
                : 'bg-primary-500 active:bg-primary-700'
            }`}
          >
            <Text className="text-[17px] font-bold text-white">
              Выбрать эту точку
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
