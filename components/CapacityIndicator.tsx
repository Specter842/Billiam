import { useThemeColors, Fonts, TypeScale, Spacing, ThemeColors } from '@/theme/constants';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  seatsRemaining: number | null;
  capacity: number | null;
  requiresTicket?: boolean;
};

/**
 * CapacityIndicator — shows seats remaining using royal (the only accent).
 * IBM Plex Mono numerals with increased letter-spacing.
 */
export default function CapacityIndicator({ seatsRemaining, capacity, requiresTicket = true }: Props) {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);

  if (!requiresTicket) {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>No ticket required — just show up</Text>
      </View>
    );
  }

  if (seatsRemaining === null || capacity === null) {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>Capacity TBD</Text>
      </View>
    );
  }

  const isSoldOut = seatsRemaining === 0;
  const isLow = seatsRemaining > 0 && seatsRemaining <= Math.ceil(capacity * 0.1);

  return (
    <View style={styles.row}>
      <Text style={[styles.numeral, isSoldOut && styles.numeralMuted]}>
        {isSoldOut ? '0' : seatsRemaining}
      </Text>
      <Text style={styles.label}>
        {isSoldOut ? ' seats left — waitlist open' : isLow ? ' seats left' : ` of ${capacity} seats left`}
      </Text>
    </View>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  numeral: {
    fontFamily: Fonts.monoMedium,
    ...TypeScale.body,
    color: Colors.royal,
    letterSpacing: 0.5,
  },
  numeralMuted: {
    color: Colors.muted,
  },
  label: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.muted,
  },
});
