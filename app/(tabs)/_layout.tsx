import { Tabs } from 'expo-router';
import { useThemeColors, Fonts } from '@/theme/constants';
import { useAuth } from '@/lib/auth';
import { ADMIN_EMAIL } from '@/lib/admin';
import { Platform, Text } from 'react-native';

const ICONS: Record<string, { active: string; inactive: string }> = {
  index:     { active: '◉', inactive: '○' },
  locations: { active: '◈', inactive: '◇' },
  calendar:  { active: '▣', inactive: '□' },
  hostels:   { active: '⬛', inactive: '⬜' },
  contact:   { active: '◆', inactive: '◇' },
  admin:     { active: '⚙', inactive: '⚙' },
};

export default function TabsLayout() {
  const Colors = useThemeColors();
  const { profile } = useAuth();
  const isAdmin = profile?.email === ADMIN_EMAIL;
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
        name="locations"
        options={{ title: 'Locations', tabBarLabel: 'Locations' }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Schedule', tabBarLabel: 'Schedule' }}
      />
      <Tabs.Screen
        name="hostels"
        options={{ title: 'Hostels', tabBarLabel: 'Hostels' }}
      />
      <Tabs.Screen
        name="contact"
        options={{ title: 'Contact', tabBarLabel: 'Contact' }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarLabel: 'Admin',
          // Hidden from the tab bar (and unreachable via it) for everyone
          // except the admin email — enforced for real by RLS server-side,
          // this is just UX so non-admins don't see a dead-end tab.
          href: isAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}
