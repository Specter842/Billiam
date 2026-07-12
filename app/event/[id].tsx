import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase, Event, RegisterResult } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import CapacityIndicator from '@/components/CapacityIndicator';
import TicketCard from '@/components/TicketCard';
import { formatEventDate, formatEventTimeRange } from '@/lib/format';
import { useThemeColors, Fonts, TypeScale, Spacing, Radius, Shadows, ThemeColors } from '@/theme/constants';

type RegistrationState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'cancelling' }
  | { phase: 'done'; result: RegisterResult; eventName: string; event: Event };

export default function EventDetailScreen() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [regState, setRegState] = useState<RegistrationState>({ phase: 'idle' });
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [existingReg, setExistingReg] = useState<RegisterResult | null>(null);

  // ── Fetch event + check existing registration ──
  const fetchData = useCallback(async () => {
    if (!id || !user) return;
    const [{ data: eventData }, { data: regData }] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase
        .from('registrations')
        .select('id, status')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);
    setEvent(eventData ?? null);
    // FIX: a 'cancelled' row used to be treated identically to an active
    // one, so a user who cancelled could never see the Register button
    // again. Only 'confirmed' / 'waitlisted' rows count as "registered".
    if (regData && regData.status !== 'cancelled') {
      setAlreadyRegistered(true);
      setExistingReg({ registration_id: regData.id, status: regData.status, seats_remaining: eventData?.seats_remaining ?? 0 });
    } else {
      setAlreadyRegistered(false);
      setExistingReg(null);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Register ──
  async function handleRegister() {
    if (!user || !event) return;
    setRegState({ phase: 'loading' });

    const { data, error } = await supabase.rpc('register_for_event', {
      p_event_id: event.id,
      p_user_id: user.id,
    });

    if (error || !data) {
      setRegState({ phase: 'idle' });
      Alert.alert('Registration failed', error?.message ?? 'Please try again.');
      return;
    }

    // Refresh event to get updated seats_remaining
    const { data: refreshed } = await supabase
      .from('events')
      .select('*')
      .eq('id', event.id)
      .single();

    setEvent(refreshed ?? event);
    setRegState({ phase: 'done', result: data as RegisterResult, eventName: event.name, event: refreshed ?? event });
    setAlreadyRegistered(true);
  }

  // ── Cancel ── (NEW: previously did not exist anywhere in the app)
  async function handleCancel() {
    if (!user || !event) return;
    const registrationId =
      regState.phase === 'done' ? regState.result.registration_id : existingReg?.registration_id;
    if (!registrationId) return;

    Alert.alert(
      'Cancel registration?',
      "You'll give up your spot and, if you were confirmed, someone on the waitlist may take it.",
      [
        { text: 'Keep my spot', style: 'cancel' },
        {
          text: 'Cancel registration',
          style: 'destructive',
          onPress: async () => {
            setRegState({ phase: 'cancelling' });

            const { data, error } = await supabase.rpc('cancel_registration', {
              p_registration_id: registrationId,
              p_user_id: user.id,
            });

            if (error || !data || data.error) {
              setRegState({ phase: 'idle' });
              Alert.alert('Cancellation failed', error?.message ?? data?.error ?? 'Please try again.');
              return;
            }

            const { data: refreshed } = await supabase
              .from('events')
              .select('*')
              .eq('id', event.id)
              .single();

            setEvent(refreshed ?? event);
            setAlreadyRegistered(false);
            setExistingReg(null);
            setRegState({ phase: 'idle' });
          },
        },
      ]
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.royal} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Event not found</Text>
        <Text style={styles.errorBody}>This event may have been removed.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>← Back to Events</Text>
        </Pressable>
      </View>
    );
  }

  const showTicket = regState.phase === 'done' || (alreadyRegistered && existingReg);
  const ticketResult = regState.phase === 'done' ? regState.result : existingReg;
  const isCancelling = regState.phase === 'cancelling';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* ── Event title ── */}
      <Text style={styles.eventName}>{event.name}</Text>

      {/* ── Meta row ── */}
      <View style={styles.metaBlock}>
        <MetaRow icon="📅" label={formatEventDate(event.start_time)} />
        <MetaRow icon="🕐" label={formatEventTimeRange(event.start_time, event.end_time)} mono />
        {event.location_name && (
          <MetaRow icon="📍" label={event.location_name} />
        )}
      </View>

      {/* ── Capacity ── */}
      <View style={styles.capacityBlock}>
        <CapacityIndicator
          seatsRemaining={event.seats_remaining}
          capacity={event.capacity}
          requiresTicket={event.requires_ticket}
        />
      </View>

      {/* ── Description ── */}
      {event.description ? (
        <Text style={styles.description}>{event.description}</Text>
      ) : null}

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Ticket card (post-registration) ── */}
      {!event.requires_ticket ? (
        <View style={styles.noTicketNote}>
          <Text style={styles.noTicketText}>No ticket required — just show up!</Text>
        </View>
      ) : showTicket && ticketResult ? (
        <View>
          <Text style={styles.sectionLabel}>Your registration</Text>
          <Text style={styles.ticketHint}>Tap the ticket to flip it and reveal your check-in QR code</Text>
          <TicketCard
            eventName={event.name}
            locationName={event.location_name}
            startTime={event.start_time}
            endTime={event.end_time}
            status={ticketResult.status as 'confirmed' | 'waitlisted'}
            registrationId={ticketResult.registration_id}
          />
          <Text style={styles.alreadyNote}>
            {ticketResult.status === 'confirmed'
              ? "You're registered. See you there!"
              : "You're on the waitlist. We'll notify you if a spot opens."}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.cancelButtonPressed,
              isCancelling && styles.registerButtonLoading,
            ]}
            onPress={handleCancel}
            disabled={isCancelling}
          >
            <Text style={styles.cancelButtonText}>
              {isCancelling ? 'Cancelling…' : 'Cancel registration'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          id={`register-event-${event.id}`}
          style={({ pressed }) => [
            styles.registerButton,
            pressed && styles.registerButtonPressed,
            regState.phase === 'loading' && styles.registerButtonLoading,
          ]}
          onPress={handleRegister}
          disabled={regState.phase === 'loading'}
        >
          <Text style={styles.registerButtonText}>
            {regState.phase === 'loading'
              ? 'Registering…'
              : event.seats_remaining === 0
              ? 'Join Waitlist'
              : 'Register'}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

// ── Meta row helper ──────────────────────────────────────────

function MetaRow({ icon, label, mono }: { icon: string; label: string; mono?: boolean }) {
  const Colors = useThemeColors();
  const metaStyles = getMetaStyles(Colors);
  return (
    <View style={metaStyles.row}>
      <Text style={metaStyles.icon}>{icon}</Text>
      <Text style={[metaStyles.label, mono && metaStyles.mono]}>{label}</Text>
    </View>
  );
}

const getMetaStyles = (Colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: { fontSize: 14 },
  label: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
    flex: 1,
  },
  mono: {
    fontFamily: Fonts.mono,
    letterSpacing: 0.3,
  },
});

// ── Screen styles ─────────────────────────────────────────────

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxl },
  center: {
    flex: 1,
    backgroundColor: Colors.paper,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.base,
  },
  errorTitle: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
  },
  errorBody: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
    textAlign: 'center',
  },
  link: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.body,
    color: Colors.royal,
  },
  eventName: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.display,
    color: Colors.ink,
    marginBottom: Spacing.base,
  },
  metaBlock: {
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  capacityBlock: {
    marginBottom: Spacing.base,
  },
  description: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.ink,
    lineHeight: 26,
    marginBottom: Spacing.base,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.line,
    marginVertical: Spacing.lg,
  },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.caption,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  ticketHint: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  alreadyNote: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  noTicketNote: {
    backgroundColor: Colors.royalTint,
    borderRadius: Radius,
    padding: Spacing.base,
    alignItems: 'center',
  },
  noTicketText: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.body,
    color: Colors.royal,
  },
  registerButton: {
    backgroundColor: Colors.royal,
    paddingVertical: Spacing.base,
    borderRadius: Radius,
    alignItems: 'center',
  },
  registerButtonPressed: {
    backgroundColor: Colors.royalPressed,
  },
  registerButtonLoading: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.body,
    color: Colors.paper,
  },
  cancelButton: {
    marginTop: Spacing.base,
    paddingVertical: Spacing.base,
    borderRadius: Radius,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
  },
  cancelButtonPressed: {
    backgroundColor: Colors.line,
  },
  cancelButtonText: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.body,
    color: Colors.muted,
  },
});
