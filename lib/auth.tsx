import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from './supabase';

// ── Context types ─────────────────────────────────────────────

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    phone: string
  ) => Promise<{ error: string | null; confirmedImmediately?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Bootstrap: load existing session ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Fetch profile row ──
  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('fetchProfile failed:', error.message);
    }
    setProfile(data ?? null);
    setLoading(false);
  }

  // ── Sign in ──
  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  // ── Sign up ──
  async function signUp(email: string, password: string, name: string, phone: string) {
    // name/phone ride along as user metadata; the on_auth_user_created
    // trigger (SECURITY DEFINER) writes the profiles row from them. Doing
    // it there instead of a client-side upsert avoids an RLS failure when
    // email confirmation is enabled: signUp() returns before a session
    // exists, so auth.uid() is null for any request we'd send here.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    });
    if (error) return { error: error.message };
    // If email confirmation is off, signUp() already returns a live
    // session — the auth listener above picks it up. Callers use this to
    // skip the "check your email" screen and go straight into the app.
    return { error: null, confirmedImmediately: data.session !== null };
  }

  // ── Sign out ──
  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  // ── Refresh profile (e.g. after edits) ──
  async function refreshProfile() {
    if (session?.user) await fetchProfile(session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
