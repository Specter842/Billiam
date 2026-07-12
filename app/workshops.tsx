import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase, Event } from '@/lib/supabase';
import { useThemeColors, Fonts, TypeScale, Spacing, ThemeColors } from '@/theme/constants';
import EventCard from '@/components/EventCard';

export default function WorkshopsScreen() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const [workshops, setWorkshops] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkshops = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('category', 'workshop')
      .order('start_time', { ascending: true });
    setWorkshops(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWorkshops(); }, [fetchWorkshops]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.royal} />
      </View>
    );
  }

  if (workshops.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No workshops yet</Text>
        <Text style={styles.emptyBody}>Workshop tracks will appear here once they're published.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.heading}>Workshops</Text>
        <Text style={styles.subheading}>
          Pick a track — each one registers separately and has its own seats.
        </Text>
      </View>
      {workshops.map((workshop) => (
        <EventCard
          key={workshop.id}
          event={workshop}
          onPress={() => router.push(`/event/${workshop.id}`)}
        />
      ))}
    </ScrollView>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.paper },
  content: { paddingBottom: Spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.paper },
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
    padding: Spacing.base,
    paddingBottom: Spacing.sm,
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
});
