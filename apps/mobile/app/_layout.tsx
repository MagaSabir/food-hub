import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import '../global.css';
import { AppProviders } from '@/providers/app-providers';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FAFAFB' },
          }}
        />
        <StatusBar style="dark" />
      </AppProviders>
    </SafeAreaProvider>
  );
}
