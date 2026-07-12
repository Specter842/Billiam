import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { supabase, Event } from '@/lib/supabase';
import { useThemeColors, Fonts, TypeScale, Spacing, Radius, Shadows, ThemeColors } from '@/theme/constants';

export default function LocationsScreen() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .not('location_name', 'is', null)
      .order('start_time', { ascending: true });
    setEvents(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.royal} />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No locations yet</Text>
        <Text style={styles.emptyBody}>
          Event locations will appear here once they're added.
        </Text>
      </View>
    );
  }

  // Group events under their venue so a shared location (e.g. the same
  // ballroom hosting three sessions) shows once with all its events under it.
  const byVenue = new Map<string, Event[]>();
  for (const event of events) {
    const key = event.location_name!;
    if (!byVenue.has(key)) byVenue.set(key, []);
    byVenue.get(key)!.push(event);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.royal} />}
    >
      <View style={styles.intro}>
        <Text style={styles.heading}>Venue Locations</Text>
        <Text style={styles.subheading}>Where each event is happening.</Text>
      </View>

      {Array.from(byVenue.entries()).map(([location, venueEvents]) => (
        <View key={location} style={[styles.venueCard, Shadows.card]}>
          <Text style={styles.venueName}>{location}</Text>
          {venueEvents.map((event) => (
            <Pressable
              key={event.id}
              style={({ pressed }) => [styles.eventRow, pressed && styles.eventRowPressed]}
              onPress={() => router.push(`/event/${event.id}`)}
            >
              <View style={styles.eventInfo}>
                <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
                <Text style={styles.eventSeats}>
                  {!event.requires_ticket
                    ? 'No ticket required'
                    : event.seats_remaining === null
                    ? 'Capacity TBD'
                    : event.seats_remaining === 0
                    ? 'Sold out'
                    : `${event.seats_remaining} seats left`}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxl, gap: Spacing.base },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.paper,
  },
  empty: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    backgroundColor: Colors.paper,
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
  },
  intro: {
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  heading: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.display,
    color: Colors.ink,
  },
  subheading: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
  },
  venueCard: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    overflow: 'hidden',
  },
  venueName: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.caption,
    color: Colors.muted,
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    gap: Spacing.base,
  },
  eventRowPressed: {
    backgroundColor: Colors.royalTint,
  },
  eventInfo: { flex: 1, gap: 2 },
  eventName: {
    fontFamily: Fonts.displayMedium,
    ...TypeScale.body,
    color: Colors.ink,
  },
  eventSeats: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.royal,
  },
  chevron: {
    fontFamily: Fonts.body,
    fontSize: 20,
    color: Colors.royal,
  },
});
