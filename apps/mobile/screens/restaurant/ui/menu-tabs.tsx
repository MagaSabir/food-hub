import { Pressable, ScrollView, Text, View } from 'react-native';

export interface MenuTab {
  id: string;
  title: string;
}

interface MenuTabsProps {
  tabs: MenuTab[];
  activeId: string;
  onChange: (id: string) => void;
}

/**
 * Липкая строка категорий меню. Активная — зелёная, с подчёркиванием.
 */
export function MenuTabs({ tabs, activeId, onChange }: MenuTabsProps) {
  return (
    <View className="border-b border-hairline bg-white">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.title}
              className="px-4 pb-2.5 pt-3"
            >
              <Text
                className={`text-[15px] font-semibold ${
                  isActive ? 'text-primary-500' : 'text-ink-secondary'
                }`}
              >
                {tab.title}
              </Text>
              <View
                className={`mt-2 h-[3px] rounded-full ${
                  isActive ? 'bg-primary-500' : 'bg-transparent'
                }`}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
