import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { useThemeColors, Fonts, TypeScale, Spacing, Radius, Shadows, ThemeColors } from '@/theme/constants';
import StatusChip from './StatusChip';

type Props = {
  eventName: string;
  locationName: string | null;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'waitlisted';
  registrationId: string;
};

const FLIP_DURATION = 450;
const CARD_HEIGHT = 240;

/**
 * TicketCard — the signature element of the app.
 *
 * Tap anywhere on the card to flip it over (3D rotateY) and reveal a QR
 * code on the back, encoding the registration id for check-in scanning.
 *
 * Layout (front):
 *   ┌─────────────────────────────┐
 *   │  Event name (Space Grotesk) │  ← top half
 *   │  Date · Time (IBM Plex Mono)│
 *   │  Location                   │
 *   ├ - - - - - - - - - - - - - - ┤  ← dashed perforation (line color)
 *   │  StatusChip   Conf. code    │  ← bottom half
 *   └─────────────────────────────┘
 */
export default function TicketCard({ eventName, locationName, startTime, endTime, status, registrationId }: Props) {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const [flipped, setFlipped] = useState(false);
  const rotation = useSharedValue(0);

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

  function handleFlip() {
    const next = !flipped;
    setFlipped(next);
    rotation.value = withTiming(next ? 180 : 0, { duration: FLIP_DURATION });
  }

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value}deg` }],
    opacity: interpolate(rotation.value, [0, 90, 91], [1, 1, 0], Extrapolation.CLAMP),
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value - 180}deg` }],
    opacity: interpolate(rotation.value, [89, 90, 180], [0, 1, 1], Extrapolation.CLAMP),
  }));

  return (
    <Pressable
      onPress={handleFlip}
      accessibilityRole="button"
      accessibilityLabel={flipped ? 'Ticket back. Tap to show ticket details.' : 'Ticket front. Tap to show QR code.'}
      style={styles.flipContainer}
    >
      {/* Front face */}
      <Animated.View style={[styles.face, Shadows.card, frontStyle]}>
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

        <View style={styles.perforationRow}>
          <View style={styles.perfNotchLeft} />
          <View style={styles.perforationLine} />
          <View style={styles.perfNotchRight} />
        </View>

        <View style={styles.bottomHalf}>
          <StatusChip status={status} />
          <View style={styles.codeBlock}>
            <Text style={styles.codeLabel}>REF</Text>
            <Text style={styles.code}>{shortCode}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Back face — QR code */}
      <Animated.View style={[styles.face, styles.back, Shadows.card, backStyle]}>
        <QRCode value={registrationId} size={128} color={Colors.ink} backgroundColor={Colors.paper} />
        <Text style={styles.backLabel}>SCAN TO CHECK IN</Text>
        <Text style={styles.backCode}>{shortCode}</Text>
      </Animated.View>
    </Pressable>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  flipContainer: {
    height: CARD_HEIGHT,
    marginVertical: Spacing.base,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 2,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  back: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  backLabel: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.caption,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginTop: Spacing.sm,
  },
  backCode: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    color: Colors.ink,
    letterSpacing: 2,
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
