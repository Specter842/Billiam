import { useThemeColors, Fonts, TypeScale, Spacing, Radius, Shadows, ThemeColors } from '@/theme/constants';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Event } from '@/lib/supabase';
import { formatEventDateShort, formatEventTime } from '@/lib/format';
import CapacityIndicator from './CapacityIndicator';

type Props = {
  event: Event;
  onPress: () => void;
};

/**
 * EventCard — quiet card used in the event list.
 * royal appears ONLY on the CapacityIndicator numeral and the subtle right arrow.
 */
export default function EventCard({ event, onPress }: Props) {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const start = event.start_time ? new Date(event.start_time) : null;
  const timeStr = start
    ? `${formatEventDateShort(event.start_time)}  ·  ${formatEventTime(event.start_time)}`
    : 'Date & time TBD';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${event.name}`}
    >
      {/* Date / time badge */}
      <View style={styles.dateBadge}>
        {start ? (
          <>
            <Text style={styles.dateDay}>
              {start.toLocaleDateString('en-IN', { day: 'numeric' })}
            </Text>
            <Text style={styles.dateMonth}>
              {start.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
            </Text>
          </>
        ) : (
          <Text style={styles.dateTbd}>TBD</Text>
        )}
      </View>

      {/* Main info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {event.name}
        </Text>
        {event.location_name ? (
          <Text style={styles.location} numberOfLines={1}>
            {event.location_name}
          </Text>
        ) : null}
        <Text style={styles.time}>{timeStr}</Text>
        <View style={styles.capacityRow}>
          <CapacityIndicator
            seatsRemaining={event.seats_remaining}
            capacity={event.capacity}
            requiresTicket={event.requires_ticket}
          />
        </View>
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.md,
  },
  cardPressed: {
    backgroundColor: Colors.royalTint,
  },
  dateBadge: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  dateDay: {
    fontFamily: Fonts.displayBold,
    fontSize: 22,
    lineHeight: 26,
    color: Colors.ink,
  },
  dateMonth: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    lineHeight: 14,
    color: Colors.muted,
    letterSpacing: 1,
  },
  dateTbd: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    fontFamily: Fonts.displayMedium,
    ...TypeScale.body,
    color: Colors.ink,
  },
  location: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.muted,
  },
  time: {
    fontFamily: Fonts.mono,
    ...TypeScale.caption,
    color: Colors.muted,
    letterSpacing: 0.3,
  },
  capacityRow: {
    marginTop: Spacing.xs,
  },
  chevron: {
    fontFamily: Fonts.body,
    fontSize: 20,
    color: Colors.royal,
    alignSelf: 'center',
  },
});
