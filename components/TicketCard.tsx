import { Colors, Fonts, TypeScale, Spacing, Radius, Shadows } from '@/theme/constants';
import { View, Text, StyleSheet } from 'react-native';
import StatusChip from './StatusChip';

type Props = {
  eventName: string;
  locationName: string | null;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'waitlisted';
  registrationId: string;
};

/**
 * TicketCard — the signature element of the app.
 *
 * Layout:
 *   ┌─────────────────────────────┐
 *   │  Event name (Space Grotesk) │  ← top half
 *   │  Date · Time (IBM Plex Mono)│
 *   │  Location                   │
 *   ├ - - - - - - - - - - - - - - ┤  ← dashed perforation (line color)
 *   │  StatusChip   Conf. code    │  ← bottom half
 *   └─────────────────────────────┘
 */
export default function TicketCard({ eventName, locationName, startTime, endTime, status, registrationId }: Props) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const dateStr = start.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = `${formatTime(start)} – ${formatTime(end)}`;
  const shortCode = registrationId.split('-')[0].toUpperCase();

  return (
    <View style={[styles.card, Shadows.card]}>
      {/* Top half — event details */}
      <View style={styles.topHalf}>
        <Text style={styles.eventName} numberOfLines={2}>
          {eventName}
        </Text>
        {locationName ? (
          <Text style={styles.location} numberOfLines={1}>
            {locationName}
          </Text>
        ) : null}
        <Text style={styles.datetime}>{dateStr}</Text>
        <Text style={styles.datetime}>{timeStr}</Text>
      </View>

      {/* Perforation line */}
      <View style={styles.perforationRow}>
        <View style={styles.perfNotchLeft} />
        <View style={styles.perforationLine} />
        <View style={styles.perfNotchRight} />
      </View>

      {/* Bottom half — status + code */}
      <View style={styles.bottomHalf}>
        <StatusChip status={status} />
        <View style={styles.codeBlock}>
          <Text style={styles.codeLabel}>REF</Text>
          <Text style={styles.code}>{shortCode}</Text>
        </View>
      </View>
    </View>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: Spacing.base,
  },
  topHalf: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  eventName: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  location: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.muted,
  },
  datetime: {
    fontFamily: Fonts.mono,
    ...TypeScale.caption,
    color: Colors.muted,
    letterSpacing: 0.4,
  },

  // Perforation
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perfNotchLeft: {
    width: 12,
    height: 24,
    backgroundColor: Colors.paper,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: Colors.line,
    marginLeft: -1,
  },
  perforationLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.line,
  },
  perfNotchRight: {
    width: 12,
    height: 24,
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: Colors.line,
    marginRight: -1,
  },

  // Bottom half
  bottomHalf: {
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeBlock: {
    alignItems: 'flex-end',
  },
  codeLabel: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.muted,
    marginBottom: 2,
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 18,
    lineHeight: 22,
    color: Colors.ink,
    letterSpacing: 2,
  },
});
