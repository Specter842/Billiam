import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// AsyncStorage's web shim touches `window` unconditionally, which crashes
// expo-router's Node-side static rendering pass (no DOM there). Guard
// against that so SSR gets a safe no-op while the browser still gets
// persistent sessions via localStorage.
const webStorage = {
  getItem: (key: string) =>
    Promise.resolve(typeof window === 'undefined' ? null : window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Types mirroring the schema ────────────────────────────────

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type Event = {
  id: string;
  name: string;
  description: string | null;
  // Nullable: an event can go live before its schedule/capacity is
  // finalized — the UI shows "TBD" wherever these are null.
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  capacity: number | null;
  seats_remaining: number | null;
  category: string | null;
  requires_ticket: boolean;
};

export type RegistrationStatus = 'confirmed' | 'waitlisted' | 'cancelled';

export type Registration = {
  id: string;
  user_id: string;
  event_id: string;
  rank: number | null;
  status: RegistrationStatus;
  created_at: string;
};

export type RegisterResult = {
  registration_id: string;
  status: RegistrationStatus;
  // FIX: cancel_registration() returns null here when the cancelled
  // registration was never confirmed (nothing to give back), and
  // register_for_event() never returns null. Both RPCs share this type,
  // so it has to allow null or TypeScript is lying to you.
  seats_remaining: number | null;
};

export type CancelResult = {
  registration_id: string;
  status: 'cancelled';
  seats_remaining: number | null;
  error?: string;
};
