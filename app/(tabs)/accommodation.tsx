import { ScrollView, View, Text, StyleSheet, Linking, Pressable } from 'react-native';
import { Colors, Fonts, TypeScale, Spacing, Radius, Shadows } from '@/theme/constants';

// ── Static accommodation data ─────────────────────────────────
// Per spec: "do not invent additional tables" — using static content.

type Hotel = {
  id: string;
  name: string;
  category: string;
  address: string;
  distanceToVenue: string;
  priceRange: string;
  phone: string | null;
  website: string | null;
  notes: string | null;
};

const HOTELS: Hotel[] = [
  {
    id: '1',
    name: 'The Leela Palace Bengaluru',
    category: 'Venue Hotel',
    address: '23 HAL Old Airport Rd, Kodihalli, Bengaluru 560008',
    distanceToVenue: 'On-site',
    priceRange: '₹18,000 – ₹28,000 / night',
    phone: '+91 80 2521 1234',
    website: 'https://www.theleela.com',
    notes: 'Mention the event at check-in for preferential parking.',
  },
  {
    id: '2',
    name: 'Taj MG Road Bengaluru',
    category: 'Luxury',
    address: '41/3, Mahatma Gandhi Rd, Bengaluru 560001',
    distanceToVenue: '3.2 km (~10 min)',
    priceRange: '₹12,000 – ₹20,000 / night',
    phone: '+91 80 6660 4444',
    website: 'https://www.tajhotels.com',
    notes: null,
  },
  {
    id: '3',
    name: 'Ibis Bengaluru Airport Road',
    category: 'Business',
    address: 'No. 29, HAL Airport Rd, Kodihalli, Bengaluru 560008',
    distanceToVenue: '1.1 km (~3 min)',
    priceRange: '₹4,500 – ₹7,000 / night',
    phone: '+91 80 4949 8888',
    website: 'https://www.ibis.com',
    notes: 'Complimentary shuttle to venue every 30 minutes.',
  },
  {
    id: '4',
    name: 'Citrus Hotel Bengaluru',
    category: 'Mid-range',
    address: '5-B, Ground Floor, Halasuru, Bengaluru 560042',
    distanceToVenue: '2.8 km (~8 min)',
    priceRange: '₹3,000 – ₹5,500 / night',
    phone: null,
    website: null,
    notes: 'Budget-friendly option; Uber/auto-rickshaw readily available.',
  },
];

export default function AccommodationScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.intro}>
        <Text style={styles.heading}>Where to Stay</Text>
        <Text style={styles.subheading}>
          The event takes place at The Leela Palace Bengaluru. Below are our recommended hotels
          ordered by distance to the venue. Book early — rooms fill quickly during event week.
        </Text>
      </View>

      {/* Hotel cards */}
      {HOTELS.map((hotel) => (
        <View key={hotel.id} style={[styles.card, Shadows.card]}>
          {/* Category badge */}
          <View style={styles.cardHeader}>
            <Text style={styles.category}>{hotel.category.toUpperCase()}</Text>
            <Text style={styles.distance}>{hotel.distanceToVenue}</Text>
          </View>

          <Text style={styles.hotelName}>{hotel.name}</Text>
          <Text style={styles.address}>{hotel.address}</Text>
          <Text style={styles.price}>{hotel.priceRange}</Text>

          {hotel.notes ? (
            <View style={styles.noteBubble}>
              <Text style={styles.noteText}>{hotel.notes}</Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actions}>
            {hotel.phone ? (
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                onPress={() => Linking.openURL(`tel:${hotel.phone}`)}
              >
                <Text style={styles.actionBtnText}>Call</Text>
              </Pressable>
            ) : null}
            {hotel.website ? (
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                onPress={() => Linking.openURL(hotel.website!)}
              >
                <Text style={styles.actionBtnText}>Website</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}

      {/* Footer note */}
      <Text style={styles.footer}>
        Rates are indicative and subject to availability. Contact the hotels directly to confirm event-period availability.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  card: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  category: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.muted,
  },
  distance: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.royal,
  },
  hotelName: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
  },
  address: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.muted,
  },
  price: {
    fontFamily: Fonts.mono,
    ...TypeScale.caption,
    color: Colors.ink,
    marginTop: Spacing.xs,
  },
  noteBubble: {
    backgroundColor: Colors.royalTint,
    borderRadius: Radius,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  noteText: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: Colors.royal,
    borderRadius: Radius,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  actionBtnPressed: {
    backgroundColor: Colors.royalTint,
  },
  actionBtnText: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.caption,
    color: Colors.royal,
  },
  footer: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
