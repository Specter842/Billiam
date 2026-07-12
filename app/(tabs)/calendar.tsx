import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { formatEventTime } from '@/lib/format';
import { useThemeColors, Fonts, TypeScale, Spacing, Radius, ThemeColors } from '@/theme/constants';

type DayGroup = {
  dateKey: string;         // 'YYYY-MM-DD'
  dateLabel: string;       // 'Monday, 15 September'
  chipWeekday: string;     // 'TUE'
  chipDay: string;         // '15'
  events: Event[];
};

function dateKeyOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type ScheduledEvent = Event & { start_time: string };

function groupByDay(allEvents: Event[]): DayGroup[] {
  // Events without a set time can't belong to a day — they still show on
  // the main Events tab, just not here.
  const events = allEvents.filter((e): e is ScheduledEvent => e.start_time !== null);

  const map = new Map<string, ScheduledEvent[]>();
  for (const ev of events) {
    const key = dateKeyOf(new Date(ev.start_time));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, evs]) => {
      const first = new Date(evs[0].start_time);
      return {
        dateKey: key,
        dateLabel: first.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
        chipWeekday: first.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase(),
        chipDay: String(first.getDate()),
        events: evs.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
      };
    });
}

export default function CalendarScreen() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

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

  const groups = useMemo(() => groupByDay(events), [events]);

  // Default to today if it has events, otherwise the first upcoming day.
  useEffect(() => {
    if (groups.length === 0) return;
    if (selectedDateKey && groups.some((g) => g.dateKey === selectedDateKey)) return;
    const todayKey = dateKeyOf(new Date());
    const today = groups.find((g) => g.dateKey === todayKey);
    setSelectedDateKey((today ?? groups[0]).dateKey);
  }, [groups, selectedDateKey]);

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
          {events.length > 0
            ? "Events exist but don't have times set yet — check the Events tab."
            : 'No events have been scheduled yet. Check back soon.'}
        </Text>
      </View>
    );
  }

  const selectedGroup = groups.find((g) => g.dateKey === selectedDateKey) ?? groups[0];

  return (
    <View style={styles.container}>
      {/* Date strip — the "calendar" — one chip per day that has events */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateStrip}
        contentContainerStyle={styles.dateStripContent}
      >
        {groups.map((group) => {
          const isSelected = group.dateKey === selectedGroup.dateKey;
          return (
            <Pressable
              key={group.dateKey}
              id={`calendar-day-${group.dateKey}`}
              style={[styles.dateChip, isSelected && styles.dateChipActive]}
              onPress={() => setSelectedDateKey(group.dateKey)}
            >
              <Text style={[styles.dateChipWeekday, isSelected && styles.dateChipTextActive]}>
                {group.chipWeekday}
              </Text>
              <Text style={[styles.dateChipDay, isSelected && styles.dateChipTextActive]}>
                {group.chipDay}
              </Text>
              <Text style={[styles.dateChipCount, isSelected && styles.dateChipTextActive]}>
                {group.events.length} event{group.events.length !== 1 ? 's' : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.royal} />}
      >
        <Text style={styles.dayLabel}>{selectedGroup.dateLabel}</Text>

        <View style={styles.eventList}>
          {selectedGroup.events.map((ev, idx) => {
            const isLast = idx === selectedGroup.events.length - 1;

            return (
              <Pressable
                key={ev.id}
                id={`calendar-event-${ev.id}`}
                style={({ pressed }) => [styles.eventRow, pressed && styles.eventRowPressed]}
                onPress={() => router.push(`/event/${ev.id}`)}
              >
                <View style={styles.timeCol}>
                  <Text style={styles.timeStart}>{formatEventTime(ev.start_time) || 'TBD'}</Text>
                  <Text style={styles.timeEnd}>{formatEventTime(ev.end_time)}</Text>
                </View>

                <View style={styles.track}>
                  <View style={styles.trackDot} />
                  {!isLast && <View style={styles.trackLine} />}
                </View>

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
                    {!ev.requires_ticket
                      ? 'No ticket required'
                      : ev.seats_remaining === null
                      ? 'Capacity TBD'
                      : ev.seats_remaining === 0
                      ? 'Sold out — waitlist open'
                      : `${ev.seats_remaining} seats left`}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxl },
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

  // Date strip
  dateStrip: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  dateStripContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
  },
  dateChip: {
    alignItems: 'center',
    minWidth: 68,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.paper,
    gap: 2,
  },
  dateChipActive: {
    backgroundColor: Colors.royal,
    borderColor: Colors.royal,
  },
  dateChipWeekday: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.muted,
  },
  dateChipDay: {
    fontFamily: Fonts.displayBold,
    fontSize: 20,
    lineHeight: 24,
    color: Colors.ink,
  },
  dateChipCount: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
  },
  dateChipTextActive: {
    color: Colors.paper,
  },

  // Agenda
  dayLabel: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
    marginBottom: Spacing.base,
  },
  eventList: {
    paddingLeft: Spacing.xs,
  },
  eventRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.base,
    paddingRight: Spacing.base,
    gap: Spacing.md,
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
