import { useState } from 'react';
import {
  FlatList,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XIcon } from 'phosphor-react-native';

interface PhotoGalleryModalProps {
  photos: string[];
  isVisible: boolean;
  initialIndex?: number;
  onClose: () => void;
}

export function PhotoGalleryModal({
  photos,
  isVisible,
  initialIndex = 0,
  onClose,
}: PhotoGalleryModalProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black">
        <FlatList
          data={photos}
          keyExtractor={(uri) => uri}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onMomentumScrollEnd={onScrollEnd}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={{ width, height }}
              contentFit="contain"
            />
          )}
        />

        <View
          className="absolute left-0 right-0 flex-row items-center justify-between px-4"
          style={{ top: insets.top + 8 }}
        >
          <Text className="text-[15px] font-semibold text-white">
            {photos.length > 1 ? `${activeIndex + 1} / ${photos.length}` : ''}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Закрыть галерею"
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:opacity-70"
          >
            <XIcon size={22} color="#FFFFFF" weight="bold" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
