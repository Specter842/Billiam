import { Colors, Fonts, TypeScale, Spacing, Radius } from '@/theme/constants';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  status: 'confirmed' | 'waitlisted';
};

/**
 * StatusChip — the only colored surface on the ticket card.
 * CONFIRMED: royal fill, paper text.
 * WAITLISTED: royal-tint fill, royal text.
 */
export default function StatusChip({ status }: Props) {
  const isConfirmed = status === 'confirmed';
  return (
    <View style={[styles.chip, isConfirmed ? styles.chipConfirmed : styles.chipWaitlisted]}>
      <Text style={[styles.label, isConfirmed ? styles.labelConfirmed : styles.labelWaitlisted]}>
        {isConfirmed ? 'CONFIRMED' : 'WAITLISTED'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: Radius,
  },
  chipConfirmed: {
    backgroundColor: Colors.royal,
  },
  chipWaitlisted: {
    backgroundColor: Colors.royalTint,
    borderWidth: 1,
    borderColor: Colors.royal,
  },
  label: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  labelConfirmed: {
    color: Colors.paper,
  },
  labelWaitlisted: {
    color: Colors.royal,
  },
});
