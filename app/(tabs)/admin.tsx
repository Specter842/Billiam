import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase, Event } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { ADMIN_EMAIL } from '@/lib/admin';
import { formatEventDateShort, formatEventTime } from '@/lib/format';
import { useThemeColors, Fonts, TypeScale, Spacing, Radius, ThemeColors } from '@/theme/constants';

export default function AdminScreen() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const { profile } = useAuth();
  const isAdmin = profile?.email === ADMIN_EMAIL;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [capacity, setCapacity] = useState('');
  const [category, setCategory] = useState('');
  const [requiresTicket, setRequiresTicket] = useState(true);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase.from('events').select('*').order('start_time', { ascending: true });
    setEvents(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchEvents();
  }, [isAdmin, fetchEvents]);

  // Belt-and-suspenders: the Admin tab is hidden for non-admins, but if
  // someone lands here anyway the real gate is the events RLS policies —
  // this is just what they see instead of a confusing empty screen.
  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedTitle}>Not authorized</Text>
        <Text style={styles.deniedBody}>This screen is only available to the event admin.</Text>
      </View>
    );
  }

  async function handleCreate() {
    // Only the name is truly required — everything else can go in blank
    // and be filled in later. Whatever's given still has to be valid,
    // though: a garbled date or a negative capacity is worse than none.
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    let cap: number | null = null;
    if (capacity.trim()) {
      cap = parseInt(capacity, 10);
      if (!Number.isFinite(cap) || cap <= 0) {
        setError('Capacity must be a positive number, or left blank.');
        return;
      }
    }

    let startIso: string | null = null;
    let endIso: string | null = null;
    if (startTime.trim() || endTime.trim()) {
      const start = startTime.trim() ? new Date(startTime) : null;
      const end = endTime.trim() ? new Date(endTime) : null;
      if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) {
        setError('Start and end time must be valid dates, e.g. 2026-09-15 09:00, or both left blank.');
        return;
      }
      startIso = start ? start.toISOString() : null;
      endIso = end ? end.toISOString() : null;
    }

    setCreating(true);
    setError(null);
    const { error: insertError } = await supabase.from('events').insert({
      name: name.trim(),
      description: description.trim() || null,
      start_time: startIso,
      end_time: endIso,
      location_name: locationName.trim() || null,
      lat: lat.trim() ? parseFloat(lat) : null,
      lng: lng.trim() ? parseFloat(lng) : null,
      capacity: cap,
      seats_remaining: cap,
      category: category.trim() || null,
      requires_ticket: requiresTicket,
    });
    setCreating(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setName('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setLocationName('');
    setLat('');
    setLng('');
    setCapacity('');
    setCategory('');
    setRequiresTicket(true);
    fetchEvents();
  }

  function handleDelete(event: Event) {
    Alert.alert(
      'Delete event?',
      `"${event.name}" will be permanently removed, along with any registrations for it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error: deleteError } = await supabase.from('events').delete().eq('id', event.id);
            if (deleteError) {
              Alert.alert('Delete failed', deleteError.message);
              return;
            }
            fetchEvents();
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Add Event</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Opening Keynote"
          placeholderTextColor={Colors.muted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional"
          placeholderTextColor={Colors.muted}
          multiline
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, styles.flexHalf]}>
          <Text style={styles.label}>Start time</Text>
          <TextInput
            style={styles.input}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="Blank = TBD"
            placeholderTextColor={Colors.muted}
          />
        </View>
        <View style={[styles.field, styles.flexHalf]}>
          <Text style={styles.label}>End time</Text>
          <TextInput
            style={styles.input}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="Blank = TBD"
            placeholderTextColor={Colors.muted}
          />
        </View>
      </View>
      <Text style={styles.hint}>Format: 2026-09-15 09:00 — leave both blank for "Date & time TBD".</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={locationName}
          onChangeText={setLocationName}
          placeholder="Grand Ballroom, The Leela Palace"
          placeholderTextColor={Colors.muted}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, styles.flexHalf]}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={lat}
            onChangeText={setLat}
            placeholder="12.9716"
            placeholderTextColor={Colors.muted}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.field, styles.flexHalf]}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={lng}
            onChangeText={setLng}
            placeholder="77.5946"
            placeholderTextColor={Colors.muted}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Capacity</Text>
        <TextInput
          style={styles.input}
          value={capacity}
          onChangeText={setCapacity}
          placeholder="Blank = no seat limit tracked"
          placeholderTextColor={Colors.muted}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="workshop, or leave blank for a regular event"
          placeholderTextColor={Colors.muted}
        />
      </View>

      <Pressable
        id="admin-requires-ticket-toggle"
        style={styles.toggleRow}
        onPress={() => setRequiresTicket((v) => !v)}
      >
        <View style={[styles.checkbox, requiresTicket && styles.checkboxChecked]}>
          {requiresTicket ? <Text style={styles.checkboxMark}>✓</Text> : null}
        </View>
        <Text style={styles.toggleLabel}>Requires a ticket (uncheck for e.g. a treasure hunt — no register/QR flow)</Text>
      </Pressable>

      <Pressable
        id="admin-create-button"
        style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        onPress={handleCreate}
        disabled={creating}
      >
        <Text style={styles.primaryButtonText}>{creating ? 'Creating…' : 'Create Event'}</Text>
      </Pressable>

      <View style={styles.divider} />

      <Text style={styles.heading}>Existing Events</Text>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.royal} />
      ) : events.length === 0 ? (
        <Text style={styles.emptyText}>No events yet.</Text>
      ) : (
        events.map((event) => (
          <View key={event.id} style={styles.eventRow}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventName} numberOfLines={1}>
                {event.name}
              </Text>
              <Text style={styles.eventMeta}>
                {event.start_time
                  ? `${formatEventDateShort(event.start_time)} · ${formatEventTime(event.start_time)}`
                  : 'Date TBD'}
                {' · '}
                {!event.requires_ticket
                  ? 'no ticket'
                  : event.capacity === null
                  ? 'capacity TBD'
                  : `${event.seats_remaining}/${event.capacity} seats`}
                {event.category ? ` · ${event.category}` : ''}
              </Text>
            </View>
            <Pressable
              id={`admin-delete-${event.id}`}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
              onPress={() => handleDelete(event)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxl, gap: Spacing.base },
  center: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.paper,
  },
  deniedTitle: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  deniedBody: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
    textAlign: 'center',
  },
  heading: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
  },
  errorText: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.error,
    backgroundColor: Colors.errorTint,
    padding: Spacing.sm,
    borderRadius: Radius,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  field: { gap: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.base },
  flexHalf: { flex: 1 },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    marginTop: -Spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.royal,
    borderColor: Colors.royal,
  },
  checkboxMark: {
    color: Colors.paper,
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  toggleLabel: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.ink,
    flex: 1,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.caption,
    color: Colors.ink,
    letterSpacing: 0.3,
  },
  input: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.paper,
  },
  textarea: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.royal,
    paddingVertical: Spacing.base,
    borderRadius: Radius,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryButtonPressed: {
    backgroundColor: Colors.royalPressed,
  },
  primaryButtonText: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.body,
    color: Colors.paper,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.line,
    marginVertical: Spacing.base,
  },
  emptyText: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    gap: Spacing.base,
  },
  eventInfo: { flex: 1 },
  eventName: {
    fontFamily: Fonts.displayMedium,
    ...TypeScale.body,
    color: Colors.ink,
  },
  eventMeta: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  deleteButtonPressed: {
    backgroundColor: Colors.errorTint,
  },
  deleteButtonText: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.caption,
    color: Colors.error,
  },
});
