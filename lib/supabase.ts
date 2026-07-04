import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
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
  start_time: string;
  end_time: string;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  capacity: number;
  seats_remaining: number;
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
  seats_remaining: number;
};
