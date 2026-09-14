import { Tabs } from 'expo-router';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  BagIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  UserIcon,
} from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PhosphorIcon = React.ComponentType<{
  size?: number;
  color?: string;
  weight?: 'regular' | 'fill';
}>;

const hapticTab = { tabPress: () => Haptics.selectionAsync() };

function TabBarIcon({
  Icon,
  color,
  focused,
}: {
  Icon: PhosphorIcon;
  color: string;
  focused: boolean;
}) {
  return (
    <View
      className={`h-8 min-w-[56px] items-center justify-center rounded-full ${
        focused ? 'bg-primary-50' : ''
      }`}
    >
      <Icon size={24} color={color} weight={focused ? 'fill' : 'regular'} />
    </View>
  );
}

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
          position: 'absolute',
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          borderRadius: 28,
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000000',
          shadowOpacity: 0.12,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={hapticTab}
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={HouseIcon} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        listeners={hapticTab}
        options={{
          title: 'Поиск',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              Icon={MagnifyingGlassIcon}
              color={color}
              focused={focused}
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
            <TabBarIcon Icon={BagIcon} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={hapticTab}
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={UserIcon} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
