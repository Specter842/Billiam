import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { router } from 'expo-router';
import { supabase, Event } from '@/lib/supabase';
import { Colors, Fonts, TypeScale, Spacing, Radius, Shadows } from '@/theme/constants';

export default function MapScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .not('lat', 'is', null)
      .then(({ data }) => {
        setEvents(data ?? []);
        setLoading(false);
        // Fit map to all markers after a short delay
        if (data && data.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(
              data
                .filter((e) => e.lat && e.lng)
                .map((e) => ({ latitude: e.lat!, longitude: e.lng! })),
              { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true }
            );
          }, 500);
        }
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.royal} />
      </View>
    );
  }

  const hasCoords = events.filter((e) => e.lat && e.lng);

  if (hasCoords.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No locations yet</Text>
        <Text style={styles.emptyBody}>
          Event locations will appear on the map once coordinates are added.
        </Text>
      </View>
    );
  }

  // Default center: first event's coordinates
  const firstEvent = hasCoords[0];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: firstEvent.lat!,
          longitude: firstEvent.lng!,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {hasCoords.map((event) => (
          <Marker
            key={event.id}
            coordinate={{ latitude: event.lat!, longitude: event.lng! }}
            pinColor={Colors.royal}
            title={event.name}
            description={event.location_name ?? undefined}
          >
            <View style={styles.markerDot} />
            <Callout
              onPress={() => router.push(`/event/${event.id}`)}
              style={styles.callout}
            >
              <Text style={styles.calloutName} numberOfLines={2}>
                {event.name}
              </Text>
              {event.location_name ? (
                <Text style={styles.calloutLocation}>{event.location_name}</Text>
              ) : null}
              <Text style={styles.calloutSeats}>
                {event.seats_remaining === 0 ? 'Sold out' : `${event.seats_remaining} seats left`}
              </Text>
              <Text style={styles.calloutTap}>Tap to view →</Text>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>{hasCoords.length} event{hasCoords.length !== 1 ? 's' : ''} nearby</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.paper,
  },
  empty: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    backgroundColor: Colors.paper,
  },
  emptyTitle: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  emptyBody: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
  },

  // Custom marker
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.royal,
    borderWidth: 2,
    borderColor: Colors.paper,
    ...Shadows.card,
  },

  // Callout bubble
  callout: {
    width: 200,
    padding: Spacing.sm,
  },
  calloutName: {
    fontFamily: Fonts.displayMedium,
    ...TypeScale.caption,
    color: Colors.ink,
    marginBottom: 2,
  },
  calloutLocation: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.muted,
  },
  calloutSeats: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.royal,
    marginTop: 2,
  },
  calloutTap: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.royal,
    marginTop: Spacing.xs,
  },

  // Legend overlay
  legend: {
    position: 'absolute',
    bottom: Spacing.xl,
    alignSelf: 'center',
    backgroundColor: Colors.paper,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadows.card,
  },
  legendText: {
    fontFamily: Fonts.mono,
    ...TypeScale.caption,
    color: Colors.muted,
  },
});
