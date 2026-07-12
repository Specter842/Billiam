import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { supabase, Event } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import EventCard from '@/components/EventCard';
import { useThemeColors, Fonts, TypeScale, Spacing, Radius, ThemeColors } from '@/theme/constants';

export default function EventListScreen() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const { signOut, profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });
    if (error) setError(error.message);
    else setEvents(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, [fetchEvents]);

  // Workshops get their own page (there are 8 of them) instead of
  // cluttering the main list — see app/workshops.tsx.
  const mainEvents = events.filter((e) => e.category !== 'workshop');
  const workshopCount = events.length - mainEvents.length;

  // ── Empty state ──
  if (!loading && events.length === 0 && !error) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No events yet</Text>
        <Text style={styles.emptyBody}>
          Events will appear here once they're published.{'\n'}Pull down to refresh.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Greeting strip */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          Hello{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
        </Text>
        <Pressable id="sign-out-button" onPress={signOut}>
          <Text style={styles.signOutLink}>Sign out</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={Colors.royal}
        />
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Couldn't load events</Text>
          <Text style={styles.emptyBody}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={mainEvents}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            workshopCount > 0 ? (
              <Pressable
                id="workshops-banner"
                style={({ pressed }) => [styles.workshopsBanner, pressed && styles.workshopsBannerPressed]}
                onPress={() => router.push('/workshops')}
              >
                <View style={styles.workshopsBannerText}>
                  <Text style={styles.workshopsBannerTitle}>Workshops</Text>
                  <Text style={styles.workshopsBannerSubtitle}>
                    {workshopCount} track{workshopCount !== 1 ? 's' : ''} — singing, dance, acting & more
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/event/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.royal}
            />
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  greetingText: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.caption,
    color: Colors.muted,
  },
  signOutLink: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.royal,
  },
  loader: { flex: 1 },
  list: { paddingBottom: Spacing.xl },
  workshopsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.royalTint,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    padding: Spacing.base,
    borderRadius: Radius,
    gap: Spacing.base,
  },
  workshopsBannerPressed: {
    backgroundColor: Colors.royal,
  },
  workshopsBannerText: { flex: 1, gap: 2 },
  workshopsBannerTitle: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.royal,
  },
  workshopsBannerSubtitle: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.ink,
  },
  chevron: {
    fontFamily: Fonts.body,
    fontSize: 20,
    color: Colors.royal,
  },
  empty: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  emptyBody: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
    lineHeight: 24,
  },
});
