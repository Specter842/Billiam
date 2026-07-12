import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeModeProvider } from '@/lib/theme';
import { useThemeColors } from '@/theme/constants';
import LoadingScreen from '@/components/LoadingScreen';
import AppHeader from '@/components/AppHeader';

// ── Inner component that handles auth-gated routing ──────────

function RootContent() {
  const Colors = useThemeColors();
  const { session, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    // FIX: this used to redirect on every change to `session`, including
    // background token refreshes — which fire periodically and were
    // silently bouncing users on `event/[id]` (or anywhere in `(tabs)`)
    // back to the Events tab mid-session. Only redirect when the current
    // screen doesn't match the auth state, not on every session update.
    const inAuthGroup = segments[0] === '(auth)';
    if (session && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [session, loading, segments]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.paper }}>
      {session && <AppHeader />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="event/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Events',
            headerStyle: { backgroundColor: Colors.paper },
            headerShadowVisible: false,
            headerTintColor: Colors.royal,
          }}
        />
        <Stack.Screen
          name="workshops"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Events',
            headerStyle: { backgroundColor: Colors.paper },
            headerShadowVisible: false,
            headerTintColor: Colors.royal,
          }}
        />
      </Stack>
    </View>
  );
}

// ── Loads fonts, then wraps everything in AuthProvider ────────

function RootLayoutInner() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootContent />
    </AuthProvider>
  );
}

// ── Root layout — theme has to wrap everything else, since both the
// loading screen and the auth-gated content read from it ────────────

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeModeProvider>
        <RootLayoutInner />
      </ThemeModeProvider>
    </SafeAreaProvider>
  );
}
