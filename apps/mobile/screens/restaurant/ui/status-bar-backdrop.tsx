import { Animated } from 'react-native';

interface StatusBarBackdropProps {
  opacity: Animated.AnimatedInterpolation<number>;
  height: number;
}

export function StatusBarBackdrop({ opacity, height }: StatusBarBackdropProps) {
  return (
    <Animated.View
      pointerEvents="none"
      style={{ opacity, height }}
      className="absolute left-0 right-0 top-0 bg-white"
    />
  );
}
