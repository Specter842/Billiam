// Single hardcoded admin for now, as requested — swap this for a real
// roles table/column if more than one admin is ever needed. Enforced for
// real by Supabase RLS policies on `events` (see supabase/schema.sql);
// this constant only controls client-side UI (hiding the tab, etc).
export const ADMIN_EMAIL = 'user@example.com';
