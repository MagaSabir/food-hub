import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onlineManager } from '@tanstack/react-query';
import { WifiSlashIcon } from 'phosphor-react-native';

export function OfflinePill() {
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());

  useEffect(() => onlineManager.subscribe(setIsOnline), []);

  if (isOnline) return null;

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 items-center"
      style={{ top: insets.top + 6 }}
    >
      <View className="flex-row items-center gap-2 rounded-full bg-ink px-3.5 py-2">
        <WifiSlashIcon size={16} color="#FFFFFF" weight="bold" />
        <Text className="text-[13px] font-semibold text-white">
          Нет интернета
        </Text>
      </View>
    </View>
  );
}
