import { Animated } from 'react-native';

interface StatusBarBackdropProps {
  /** 0 → фото видно под часами, 1 → белая подложка. Считает экран по скроллу. */
  opacity: Animated.AnimatedInterpolation<number>;
  height: number;
}

/**
 * Белая подложка ровно под статус-баром. В начале экрана прозрачная — обложка
 * занимает весь верх; к середине фото проявляется, чтобы часы и заряд не
 * читались поверх уезжающего контента.
 */
export function StatusBarBackdrop({ opacity, height }: StatusBarBackdropProps) {
  return (
    <Animated.View
      pointerEvents="none"
      style={{ opacity, height }}
      className="absolute left-0 right-0 top-0 bg-white"
    />
  );
}
