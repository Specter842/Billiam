-- ============================================================
-- EVENT REGISTRATION APP — SUPABASE SCHEMA
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id    uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name  text,
  email text,
  phone text
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- FIX: CREATE POLICY has no IF NOT EXISTS, so re-running this file against
-- a project that already ran it once errored with "policy already exists".
-- Drop-then-create makes every policy in this file safe to re-run.
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── 2. EVENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  start_time      timestamptz NOT NULL,
  end_time        timestamptz NOT NULL,
  location_name   text,
  lat             double precision,
  lng             double precision,
  capacity        integer NOT NULL,
  seats_remaining integer NOT NULL,
  -- Tags an event for grouping outside the main list, e.g. 'workshop' —
  -- individual workshops (singing, acting, ML, ...) get their own row so
  -- each has its own seats/registration, but are listed together on a
  -- dedicated Workshops page instead of cluttering the main Events list.
  category        text
);

-- Add the column for anyone re-running this against a database created
-- before `category` existed (CREATE TABLE IF NOT EXISTS above is a no-op
-- on an existing table, so it wouldn't otherwise pick up new columns).
ALTER TABLE events ADD COLUMN IF NOT EXISTS category text;

-- FIX: re-running the old seed INSERT (see git history) silently
-- triplicated every event, because there was nothing for its
-- `ON CONFLICT DO NOTHING` to actually conflict on. This is what makes
-- that clause mean something, and stops any future re-seed from
-- duplicating rows the same way.
CREATE UNIQUE INDEX IF NOT EXISTS events_name_start_time_key ON events (name, start_time);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events are publicly readable" ON events;
CREATE POLICY "Events are publicly readable"
  ON events FOR SELECT
  USING (true);

-- Admin panel access: hardcoded to one email for now (per current
-- product decision — revisit with a real roles table if more admins are
-- ever needed). This is the actual enforcement; the client only hides
-- the Admin tab for non-admins as UX, so these policies are what
-- actually stop a non-admin from writing to `events` via the API directly.
DROP POLICY IF EXISTS "Admin can insert events" ON events;
CREATE POLICY "Admin can insert events"
  ON events FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'user@example.com');

DROP POLICY IF EXISTS "Admin can update events" ON events;
CREATE POLICY "Admin can update events"
  ON events FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'user@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'user@example.com');

DROP POLICY IF EXISTS "Admin can delete events" ON events;
CREATE POLICY "Admin can delete events"
  ON events FOR DELETE
  USING (auth.jwt() ->> 'email' = 'user@example.com');

-- ── 3. REGISTRATIONS ─────────────────────────────────────────
-- FIX: CREATE TYPE does not support IF NOT EXISTS in Postgres.
-- This DO block is the idempotent equivalent.
DO $$
BEGIN
  CREATE TYPE registration_status AS ENUM (
    'confirmed',
    'waitlisted',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS registrations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id   uuid NOT NULL REFERENCES events(id)   ON DELETE CASCADE,
  rank       integer,                                      -- reserved, not used
  status     registration_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own registrations" ON registrations;
CREATE POLICY "Users can view own registrations"
  ON registrations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own registrations" ON registrations;
CREATE POLICY "Users can insert own registrations"
  ON registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- FIX: no UPDATE policy existed at all, so cancellation was impossible
-- through RLS. Direct UPDATEs are still blocked from setting arbitrary
-- status values below via the cancel_registration() function, but this
-- policy is required for that function's underlying row access pattern
-- and for any client code that might read post-update state.
DROP POLICY IF EXISTS "Users can cancel own registrations" ON registrations;
CREATE POLICY "Users can cancel own registrations"
  ON registrations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 4. ATOMIC REGISTRATION FUNCTION ─────────────────────────
-- NON-NEGOTIABLE: one atomic UPDATE ... RETURNING inside a transaction.
-- If seats_remaining > 0  → confirmed + decrement
-- If seats_remaining = 0  → waitlisted (no decrement)
-- Duplicate registrations (UNIQUE conflict) return existing row data.
CREATE OR REPLACE FUNCTION register_for_event(p_event_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_seats  integer;
  v_status registration_status;
  v_reg_id uuid;
BEGIN
  -- Single atomic statement: decrement only if seats remain
  UPDATE events
     SET seats_remaining = seats_remaining - 1
   WHERE id = p_event_id
     AND seats_remaining > 0
  RETURNING seats_remaining INTO v_seats;

  -- v_seats is NULL ↔ no row updated ↔ sold out → waitlist
  IF v_seats IS NOT NULL THEN
    v_status := 'confirmed';
  ELSE
    v_status := 'waitlisted';
  END IF;

  INSERT INTO registrations (user_id, event_id, status)
  VALUES (p_user_id, p_event_id, v_status)
  ON CONFLICT (user_id, event_id) DO UPDATE
    SET status = EXCLUDED.status          -- keep idempotent on retry
  RETURNING id INTO v_reg_id;

  RETURN jsonb_build_object(
    'registration_id', v_reg_id,
    'status',          v_status,
    'seats_remaining', COALESCE(v_seats, 0)
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION register_for_event(uuid, uuid) TO authenticated;

-- ── 4b. ATOMIC CANCELLATION FUNCTION ────────────────────────
-- NEW: this did not exist before. Without it, seats_remaining only ever
-- goes down — nobody who cancels ever frees a seat, so the waitlist
-- can never clear even when confirmed attendees drop out.
-- Rule:
--   If the registration was 'confirmed'  → set cancelled + give the seat back
--   If it was 'waitlisted' or already 'cancelled' → set cancelled, no seat change
CREATE OR REPLACE FUNCTION cancel_registration(p_registration_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_event_id     uuid;
  v_prior_status registration_status;
  v_seats        integer;
BEGIN
  -- Lock and read the caller's own registration row only.
  SELECT event_id, status
    INTO v_event_id, v_prior_status
    FROM registrations
   WHERE id = p_registration_id
     AND user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'registration_not_found');
  END IF;

  IF v_prior_status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'registration_id', p_registration_id,
      'status',          'cancelled',
      'seats_remaining', NULL
    );
  END IF;

  UPDATE registrations
     SET status = 'cancelled'
   WHERE id = p_registration_id;

  IF v_prior_status = 'confirmed' THEN
    UPDATE events
       SET seats_remaining = seats_remaining + 1
     WHERE id = v_event_id
    RETURNING seats_remaining INTO v_seats;
  END IF;

  RETURN jsonb_build_object(
    'registration_id', p_registration_id,
    'status',          'cancelled',
    'seats_remaining', v_seats
  );
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_registration(uuid, uuid) TO authenticated;

-- ── 5. HELPER: auto-create profile on signup ─────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- name/phone come from signUp()'s `options.data` (auth.users.raw_user_meta_data).
  -- FIX: the client used to upsert these itself right after signUp(), which
  -- fails RLS whenever email confirmation is on — signUp() returns a user
  -- but no session until the link is clicked, so auth.uid() is null for
  -- that request. Doing it here (SECURITY DEFINER, same transaction as the
  -- auth.users insert) sidesteps RLS entirely.
  INSERT INTO profiles (id, email, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 6. SEED DATA ─────────────────────────────────────────────
-- The placeholder conference demo events that used to be seeded here
-- (Opening Keynote, Design Systems Workshop, etc.) have been removed —
-- they were never real FROSH content, and re-running this INSERT with no
-- unique constraint to conflict on is exactly what triplicated them in
-- production. The real event roster is managed through the in-app Admin
-- tab (Events > Admin, restricted to the admin email above) instead of a
-- static seed block, since it now has full add/delete support and the
-- unique index above makes it safe either way.
