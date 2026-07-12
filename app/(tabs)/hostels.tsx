import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeColors, Fonts, TypeScale, Spacing, Radius, Shadows, ThemeColors } from '@/theme/constants';

// ── Hostel data ────────────────────────────────────────────────
// Fees per official hostel fee table. `description` is left blank for
// each hostel until real copy is supplied — add it there and it'll
// appear under the hostel name automatically, no UI changes needed.

type RoomType = {
  label: string;
  fee: number;
};

type Hostel = {
  name: string;
  previouslyKnownAs?: string;
  rooms: RoomType[];
  description?: string;
};

const MESS_FEE = 26900;

const BOYS_HOSTELS: Hostel[] = [
  {
    name: 'Vyan Hall',
    previouslyKnownAs: 'Hostel-H',
    rooms: [
      { label: '4S AC with Shared Bath', fee: 45600 },
      { label: '2S AC with Shared Bath', fee: 57000 },
      { label: '2S Non AC with Shared Bath', fee: 45500 },
    ],
  },
  {
    name: 'Tejas Hall',
    previouslyKnownAs: 'Hostel-J',
    rooms: [
      { label: '1S Non AC with Shared Bath', fee: 51000 },
      { label: '2S AC with Shared Bath', fee: 57000 },
    ],
  },
  {
    name: 'Ambaram Hall',
    previouslyKnownAs: 'Hostel-K',
    rooms: [
      { label: '2S Non AC with Shared Bath', fee: 45500 },
      { label: '2S AC with Shared Bath', fee: 57000 },
    ],
  },
  {
    name: 'Viyat Hall',
    previouslyKnownAs: 'Hostel-L',
    rooms: [{ label: '2S AC with Shared Bath', fee: 57000 }],
  },
  {
    name: 'Hostel-FRF',
    rooms: [{ label: '3S Non AC with Shared Bath, Flat Type Accommodation', fee: 39500 }],
  },
  {
    name: 'Hostel-FRG',
    rooms: [{ label: '3S Non AC with Shared Bath, Flat Type Accommodation', fee: 39500 }],
  },
];

const GIRLS_HOSTELS: Hostel[] = [
  {
    name: 'Vasudha Hall',
    previouslyKnownAs: 'Block E, Hostel-E',
    rooms: [
      { label: '3S AC with Shared Bath', fee: 50500 },
      { label: '4S AC with Shared Bath', fee: 45600 },
    ],
  },
  {
    name: 'Vasudha Hall',
    previouslyKnownAs: 'Block G, Hostel-G',
    rooms: [
      { label: '3S AC with Shared Bath', fee: 50500 },
      { label: '4S AC with Shared Bath', fee: 45600 },
    ],
  },
  {
    name: 'Ira Hall',
    previouslyKnownAs: 'Hostel-I',
    rooms: [
      { label: '3S AC with Shared Bath', fee: 50500 },
      { label: '1S Non AC with Shared Bath', fee: 51000 },
    ],
  },
  {
    name: 'Vahni Hall',
    previouslyKnownAs: 'Hostel-Q',
    rooms: [{ label: '2S AC with Shared Bath Between two rooms', fee: 61500 }],
  },
];

function formatFee(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Screen ─────────────────────────────────────────────────────

type Section = 'boys' | 'girls';

export default function HostelsScreen() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const [section, setSection] = useState<Section>('boys');
  const hostels = section === 'boys' ? BOYS_HOSTELS : GIRLS_HOSTELS;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.heading}>Hostels</Text>
        <Text style={styles.subheading}>
          On-campus accommodation for the event. Mess fee is billed separately from the room fee.
        </Text>
      </View>

      <View style={styles.toggle}>
        <Pressable
          style={[styles.toggleButton, section === 'boys' && styles.toggleButtonActive]}
          onPress={() => setSection('boys')}
        >
          <Text style={[styles.toggleText, section === 'boys' && styles.toggleTextActive]}>
            Boys Hostels
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, section === 'girls' && styles.toggleButtonActive]}
          onPress={() => setSection('girls')}
        >
          <Text style={[styles.toggleText, section === 'girls' && styles.toggleTextActive]}>
            Girls Hostels
          </Text>
        </Pressable>
      </View>

      {hostels.map((hostel, idx) => (
        <View key={`${hostel.name}-${idx}`} style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.hostelName}>{hostel.name}</Text>
            {hostel.previouslyKnownAs ? (
              <Text style={styles.previouslyKnown}>Previously {hostel.previouslyKnownAs}</Text>
            ) : null}
          </View>

          {hostel.description ? (
            <Text style={styles.description}>{hostel.description}</Text>
          ) : null}

          <View style={styles.roomList}>
            {hostel.rooms.map((room) => (
              <View key={room.label} style={styles.roomRow}>
                <Text style={styles.roomLabel}>{room.label}</Text>
                <Text style={styles.roomFee}>{formatFee(room.fee)}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.messNote}>
        <Text style={styles.messNoteLabel}>Mess Fee</Text>
        <Text style={styles.messNoteFee}>{formatFee(MESS_FEE)}</Text>
        <Text style={styles.messNoteHint}>Applies to all {section === 'boys' ? 'boys' : 'girls'} hostels above.</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxl, gap: Spacing.base },
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
    lineHeight: 24,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.royalTint,
    borderRadius: Radius,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius - 4,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.royal,
  },
  toggleText: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.caption,
    color: Colors.royal,
  },
  toggleTextActive: {
    color: Colors.paper,
  },
  card: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  hostelName: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
  },
  previouslyKnown: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
  },
  description: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
  },
  roomList: {
    gap: Spacing.xs,
  },
  roomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  roomLabel: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.ink,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  roomFee: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.royal,
  },
  messNote: {
    backgroundColor: Colors.royalTint,
    borderRadius: Radius,
    padding: Spacing.base,
    alignItems: 'center',
    gap: 2,
  },
  messNoteLabel: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.caption,
    color: Colors.royal,
    letterSpacing: 0.5,
  },
  messNoteFee: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
  },
  messNoteHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
});
