import { Tabs } from 'expo-router';
import { Colors, Fonts } from '@/theme/constants';
import { Platform, Text } from 'react-native';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  // Using emoji icons — no icon library required
  const icons: Record<string, string> = {
    Events:         focused ? '◉' : '○',
    Map:            focused ? '◈' : '◇',
    Schedule:       focused ? '▣' : '□',
    Accommodation:  focused ? '⬛' : '⬜',
    Contact:        focused ? '◆' : '◇',
  };
  return null; // icon handled by tabBarIcon option below
}

const ICONS: Record<string, { active: string; inactive: string }> = {
  index:         { active: '◉', inactive: '○' },
  map:           { active: '◈', inactive: '◇' },
  calendar:      { active: '▣', inactive: '□' },
  accommodation: { active: '⬛', inactive: '⬜' },
  contact:       { active: '◆', inactive: '◇' },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Colors.royal,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: {
          backgroundColor: Colors.paper,
          borderTopColor: Colors.line,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 84 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.body,
          fontSize: 11,
        },
        headerStyle: {
          backgroundColor: Colors.paper,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.line,
        } as any,
        headerTitleStyle: {
          fontFamily: Fonts.displayBold,
          fontSize: 20,
          color: Colors.ink,
        },
        headerTintColor: Colors.royal,
        tabBarIcon: ({ focused, color }) => {
          const icon = ICONS[route.name];
          return (
            <Text style={{ fontSize: 16, color }}>
              {focused ? icon?.active ?? '●' : icon?.inactive ?? '○'}
            </Text>
          );
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Events', tabBarLabel: 'Events' }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Map', tabBarLabel: 'Map' }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Schedule', tabBarLabel: 'Schedule' }}
      />
      <Tabs.Screen
        name="accommodation"
        options={{ title: 'Stay', tabBarLabel: 'Stay' }}
      />
      <Tabs.Screen
        name="contact"
        options={{ title: 'Contact', tabBarLabel: 'Contact' }}
      />
    </Tabs>
  );
}
