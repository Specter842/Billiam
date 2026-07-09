import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { supabase, Event } from '@/lib/supabase';
import { useThemeColors, Fonts, TypeScale, Spacing, Radius, Shadows, ThemeColors } from '@/theme/constants';

// react-native-maps has no web target, so the web build gets this list-based
// fallback in place of the native MapView used in EventMap.tsx.
export default function EventMap() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .not('lat', 'is', null)
      .then(({ data }) => {
        setEvents(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.royal} />
      </View>
    );
  }

  const hasCoords = events.filter((e) => e.lat && e.lng);

  if (hasCoords.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No locations yet</Text>
        <Text style={styles.emptyBody}>
          Event locations will appear here once coordinates are added.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.notice}>
        Interactive maps are available in the mobile app. Showing locations as a list instead.
      </Text>
      {hasCoords.map((event) => (
        <Pressable
          key={event.id}
          style={styles.card}
          onPress={() => router.push(`/event/${event.id}`)}
        >
          <Text style={styles.cardName} numberOfLines={2}>
            {event.name}
          </Text>
          {event.location_name ? (
            <Text style={styles.cardLocation}>{event.location_name}</Text>
          ) : null}
          <Text style={styles.cardSeats}>
            {event.seats_remaining === 0 ? 'Sold out' : `${event.seats_remaining} seats left`}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
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
  notice: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  cardName: {
    fontFamily: Fonts.displayMedium,
    ...TypeScale.body,
    color: Colors.ink,
    marginBottom: 2,
  },
  cardLocation: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
  },
  cardSeats: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.royal,
    marginTop: Spacing.xs,
  },
});
