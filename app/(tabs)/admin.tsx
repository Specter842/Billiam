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
    if (!name.trim() || !startTime.trim() || !endTime.trim() || !capacity.trim()) {
      setError('Name, start time, end time, and capacity are required.');
      return;
    }
    const cap = parseInt(capacity, 10);
    if (!Number.isFinite(cap) || cap <= 0) {
      setError('Capacity must be a positive number.');
      return;
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Start and end time must be valid dates, e.g. 2026-09-15 09:00');
      return;
    }

    setCreating(true);
    setError(null);
    const { error: insertError } = await supabase.from('events').insert({
      name: name.trim(),
      description: description.trim() || null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      location_name: locationName.trim() || null,
      lat: lat.trim() ? parseFloat(lat) : null,
      lng: lng.trim() ? parseFloat(lng) : null,
      capacity: cap,
      seats_remaining: cap,
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
            placeholder="2026-09-15 09:00"
            placeholderTextColor={Colors.muted}
          />
        </View>
        <View style={[styles.field, styles.flexHalf]}>
          <Text style={styles.label}>End time</Text>
          <TextInput
            style={styles.input}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="2026-09-15 11:00"
            placeholderTextColor={Colors.muted}
          />
        </View>
      </View>

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
          placeholder="100"
          placeholderTextColor={Colors.muted}
          keyboardType="numeric"
        />
      </View>

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
                {new Date(event.start_time).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' · '}
                {event.seats_remaining}/{event.capacity} seats
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
