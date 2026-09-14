import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

export function useFocusAfterTransition<T extends { focus: () => void }>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      ref.current?.focus();
    });

    return () => task.cancel();
  }, []);

  return ref;
}
