import 'react-native-reanimated';

import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProviders } from '@/providers/app-providers';
import { OfflinePill } from '@/shared/ui/offline-pill';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        {}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FAFAFB' },
          }}
        />

        {}
        <OfflinePill />

        {}
        <StatusBar style="dark" />
      </AppProviders>
    </SafeAreaProvider>
  );
}
