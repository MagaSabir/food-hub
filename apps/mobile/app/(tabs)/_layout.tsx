import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import {
  BagIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  UserIcon,
} from 'phosphor-react-native';

const hapticTab = { tabPress: () => Haptics.selectionAsync() };
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#49B85D',
        tabBarInactiveTintColor: '#1D1D1F',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000000',
          shadowOpacity: 0.1,
          shadowRadius: 40,
          shadowOffset: { width: 0, height: -10 },
          elevation: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={hapticTab}
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, focused }) => (
            <HouseIcon
              size={26}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        listeners={hapticTab}
        options={{
          title: 'Поиск',
          tabBarIcon: ({ color, focused }) => (
            <MagnifyingGlassIcon
              size={26}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        listeners={hapticTab}
        options={{
          title: 'Заказы',
          tabBarIcon: ({ color, focused }) => (
            <BagIcon
              size={26}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        listeners={hapticTab}
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, focused }) => (
            <UserIcon
              size={26}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
