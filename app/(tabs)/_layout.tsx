import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Fonts } from '@/theme/constants';
import { useAuth } from '@/lib/auth';
import { ADMIN_EMAIL } from '@/lib/admin';
import { Platform } from 'react-native';

// Unicode symbol glyphs (◉ ◈ ⬛ etc) render wildly inconsistently across
// devices/fonts — some render as tofu, others as the wrong shape entirely.
// Ionicons is a real vector icon font bundled with Expo, so it renders
// identically everywhere.
const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index:     { active: 'ticket', inactive: 'ticket-outline' },
  locations: { active: 'location', inactive: 'location-outline' },
  calendar:  { active: 'calendar', inactive: 'calendar-outline' },
  hostels:   { active: 'home', inactive: 'home-outline' },
  contact:   { active: 'call', inactive: 'call-outline' },
  admin:     { active: 'settings', inactive: 'settings-outline' },
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
          const name = icon ? (focused ? icon.active : icon.inactive) : 'ellipse-outline';
          return <Ionicons name={name} size={22} color={color} />;
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
