import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { supabase, Event } from '@/lib/supabase';
import { useThemeColors, Fonts, TypeScale, Spacing, Radius, ThemeColors } from '@/theme/constants';

type DayGroup = {
  dateKey: string;        // 'YYYY-MM-DD'
  dateLabel: string;      // 'Monday, 15 September'
  events: Event[];
};

function groupByDay(events: Event[]): DayGroup[] {
  const map = new Map<string, Event[]>();
  for (const ev of events) {
    const d = new Date(ev.start_time);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return Array.from(map.entries()).map(([key, evs]) => ({
    dateKey: key,
    dateLabel: new Date(evs[0].start_time).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    events: evs.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
  }));
}

export default function CalendarScreen() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });
    setEvents(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  const onRefresh = () => { setRefreshing(true); fetchEvents(); };

  const groups = groupByDay(events);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.royal} />
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Schedule is empty</Text>
        <Text style={styles.emptyBody}>
          No events have been scheduled yet. Check back soon.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.royal} />
      }
    >
      {groups.map((group) => (
        <View key={group.dateKey} style={styles.daySection}>
          {/* Day header */}
          <View style={styles.dayHeader}>
            <Text style={styles.dayLabel}>{group.dateLabel}</Text>
          </View>

          {/* Events for this day */}
          <View style={styles.eventList}>
            {group.events.map((ev, idx) => {
              const startTime = new Date(ev.start_time);
              const endTime = new Date(ev.end_time);
              const timeStr = `${formatTime(startTime)} – ${formatTime(endTime)}`;
              const isLast = idx === group.events.length - 1;

              return (
                <Pressable
                  key={ev.id}
                  id={`calendar-event-${ev.id}`}
                  style={({ pressed }) => [
                    styles.eventRow,
                    !isLast && styles.eventRowBordered,
                    pressed && styles.eventRowPressed,
                  ]}
                  onPress={() => router.push(`/event/${ev.id}`)}
                >
                  {/* Time column */}
                  <View style={styles.timeCol}>
                    <Text style={styles.timeStart}>
                      {formatTime(startTime)}
                    </Text>
                    <Text style={styles.timeEnd}>
                      {formatTime(endTime)}
                    </Text>
                  </View>

                  {/* Vertical track */}
                  <View style={styles.track}>
                    <View style={styles.trackDot} />
                    {!isLast && <View style={styles.trackLine} />}
                  </View>

                  {/* Event info */}
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName} numberOfLines={2}>
                      {ev.name}
                    </Text>
                    {ev.location_name ? (
                      <Text style={styles.eventLocation} numberOfLines={1}>
                        {ev.location_name}
                      </Text>
                    ) : null}
                    <Text style={styles.seatsText}>
                      {ev.seats_remaining === 0 ? 'Sold out — waitlist open' : `${ev.seats_remaining} seats left`}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
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
  daySection: {
    marginTop: Spacing.lg,
  },
  dayHeader: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  dayLabel: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
  },
  eventList: {
    paddingLeft: Spacing.base,
  },
  eventRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.base,
    paddingRight: Spacing.base,
    gap: Spacing.md,
  },
  eventRowBordered: {
    // timeline handles visual separation
  },
  eventRowPressed: {
    backgroundColor: Colors.royalTint,
  },
  timeCol: {
    width: 52,
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  timeStart: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.ink,
    letterSpacing: 0.3,
  },
  timeEnd: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    lineHeight: 14,
    color: Colors.muted,
    letterSpacing: 0.3,
  },
  track: {
    width: 16,
    alignItems: 'center',
  },
  trackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.royal,
    marginTop: 4,
  },
  trackLine: {
    flex: 1,
    width: 1,
    backgroundColor: Colors.line,
    marginTop: 4,
  },
  eventInfo: {
    flex: 1,
    gap: 2,
  },
  eventName: {
    fontFamily: Fonts.displayMedium,
    ...TypeScale.body,
    color: Colors.ink,
  },
  eventLocation: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.muted,
  },
  seatsText: {
    fontFamily: Fonts.mono,
    ...TypeScale.caption,
    color: Colors.royal,
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
