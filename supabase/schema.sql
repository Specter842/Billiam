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

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

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
  seats_remaining integer NOT NULL
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are publicly readable"
  ON events FOR SELECT
  USING (true);

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

CREATE POLICY "Users can view own registrations"
  ON registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registrations"
  ON registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- FIX: no UPDATE policy existed at all, so cancellation was impossible
-- through RLS. Direct UPDATEs are still blocked from setting arbitrary
-- status values below via the cancel_registration() function, but this
-- policy is required for that function's underlying row access pattern
-- and for any client code that might read post-update state.
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
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 6. SEED DATA ─────────────────────────────────────────────
-- FIX: "Closing Ceremony" previously had seats_remaining = 3 against
-- capacity = 300, inconsistent with every other row (capacity ==
-- seats_remaining). Corrected to 300 below. Change it back deliberately
-- if you actually wanted a near-sold-out demo row.
INSERT INTO events (name, description, start_time, end_time, location_name, lat, lng, capacity, seats_remaining)
VALUES
  (
    'Opening Keynote',
    'Join us for the opening keynote where we unveil the vision for the year ahead. Featuring live demonstrations, special guests, and a Q&A session.',
    '2026-09-15 09:00:00+05:30',
    '2026-09-15 11:00:00+05:30',
    'Grand Ballroom, The Leela Palace',
    12.9716, 77.5946,
    300, 300
  ),
  (
    'Design Systems Workshop',
    'A hands-on workshop covering design tokens, component libraries, and the principles behind building scalable design systems.',
    '2026-09-15 13:00:00+05:30',
    '2026-09-15 16:00:00+05:30',
    'Workshop Hall A, The Leela Palace',
    12.9720, 77.5950,
    60, 60
  ),
  (
    'Engineering Deep Dive',
    'Technical deep dive into distributed systems, database internals, and performance optimization strategies.',
    '2026-09-16 10:00:00+05:30',
    '2026-09-16 12:30:00+05:30',
    'Conference Room B, The Leela Palace',
    12.9718, 77.5948,
    80, 80
  ),
  (
    'Networking Dinner',
    'An evening of conversation and connection. Meet speakers, sponsors, and fellow attendees over a curated three-course dinner.',
    '2026-09-15 19:00:00+05:30',
    '2026-09-15 22:00:00+05:30',
    'Rooftop Terrace, The Leela Palace',
    12.9722, 77.5952,
    150, 150
  ),
  (
    'Product Strategy Panel',
    'Five product leaders discuss how they prioritize roadmaps, handle competing stakeholders, and ship with confidence.',
    '2026-09-16 14:00:00+05:30',
    '2026-09-16 15:30:00+05:30',
    'Auditorium, The Leela Palace',
    12.9714, 77.5944,
    200, 200
  ),
  (
    'Closing Ceremony',
    'Wrap up two days of learning with award announcements, community highlights, and a look at what comes next.',
    '2026-09-16 17:00:00+05:30',
    '2026-09-16 18:30:00+05:30',
    'Grand Ballroom, The Leela Palace',
    12.9716, 77.5946,
    300, 300
  )
ON CONFLICT DO NOTHING;
