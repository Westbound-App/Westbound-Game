-- WESTBOUND Phase A — core schema
-- All timestamps UTC (timestamptz).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  faction text NOT NULL DEFAULT 'neutral'
    CHECK (faction IN ('finisher', 'drifter', 'neutral')),
  role text NOT NULL DEFAULT 'player'
    CHECK (role IN ('viewer', 'player', 'moderator', 'admin', 'super_admin')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX profiles_display_name_lower_idx
  ON profiles (lower(display_name));

-- ---------------------------------------------------------------------------
-- games
-- ---------------------------------------------------------------------------
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  environment text NOT NULL
    CHECK (environment IN ('sandbox', 'production')),
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'active', 'paused', 'completed', 'archived')),
  start_latitude double precision NOT NULL,
  start_longitude double precision NOT NULL,
  destination_latitude double precision NOT NULL,
  destination_longitude double precision NOT NULL,
  destination_radius_meters double precision NOT NULL DEFAULT 100,
  started_at timestamptz,
  completed_at timestamptz,
  completion_locked boolean NOT NULL DEFAULT false,
  current_route_version_id uuid,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX games_environment_status_idx ON games (environment, status);

-- ---------------------------------------------------------------------------
-- route_versions
-- ---------------------------------------------------------------------------
CREATE TABLE route_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  reason text NOT NULL DEFAULT 'initial',
  source text NOT NULL DEFAULT 'seed',
  intervention_id uuid,
  total_distance_meters double precision NOT NULL DEFAULT 0,
  encoded_geometry text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (game_id, version_number)
);

CREATE INDEX route_versions_game_active_idx
  ON route_versions (game_id, is_active);

-- Deferred FK: games.current_route_version_id → route_versions.id
ALTER TABLE games
  ADD CONSTRAINT games_current_route_version_id_fkey
  FOREIGN KEY (current_route_version_id)
  REFERENCES route_versions (id)
  ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- route_segments
-- ---------------------------------------------------------------------------
CREATE TABLE route_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_version_id uuid NOT NULL REFERENCES route_versions (id) ON DELETE CASCADE,
  segment_index integer NOT NULL,
  start_latitude double precision NOT NULL,
  start_longitude double precision NOT NULL,
  end_latitude double precision NOT NULL,
  end_longitude double precision NOT NULL,
  distance_meters double precision NOT NULL CHECK (distance_meters >= 0),
  cumulative_start_meters double precision NOT NULL DEFAULT 0,
  cumulative_end_meters double precision NOT NULL DEFAULT 0,
  pedestrian_allowed boolean NOT NULL DEFAULT true,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (route_version_id, segment_index)
);

CREATE INDEX route_segments_version_idx ON route_segments (route_version_id);

-- ---------------------------------------------------------------------------
-- walker_state (1:1 with games)
-- ---------------------------------------------------------------------------
CREATE TABLE walker_state (
  game_id uuid PRIMARY KEY REFERENCES games (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN (
      'not_started',
      'walking',
      'approaching_decision',
      'decision_window_open',
      'rerouting',
      'resting',
      'paused_by_admin',
      'temporarily_blocked',
      'completed'
    )),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  active_route_segment_id uuid REFERENCES route_segments (id) ON DELETE SET NULL,
  distance_into_segment_meters double precision NOT NULL DEFAULT 0,
  total_distance_walked_meters double precision NOT NULL DEFAULT 0,
  original_route_distance_meters double precision NOT NULL DEFAULT 0,
  current_projected_remaining_meters double precision NOT NULL DEFAULT 0,
  current_speed_mps double precision NOT NULL DEFAULT 0,
  movement_started_at timestamptz,
  next_state_change_at timestamptz,
  version_number bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- game_events
-- ---------------------------------------------------------------------------
CREATE TABLE game_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  related_user_id uuid REFERENCES profiles (id) ON DELETE SET NULL,
  related_intervention_id uuid,
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'internal')),
  occurred_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX game_events_game_occurred_idx
  ON game_events (game_id, occurred_at DESC);

-- ---------------------------------------------------------------------------
-- wallets
-- ---------------------------------------------------------------------------
CREATE TABLE wallets (
  user_id uuid PRIMARY KEY REFERENCES profiles (id) ON DELETE CASCADE,
  available_balance bigint NOT NULL DEFAULT 0
    CHECK (available_balance >= 0),
  lifetime_credits_added bigint NOT NULL DEFAULT 0
    CHECK (lifetime_credits_added >= 0),
  lifetime_credits_spent bigint NOT NULL DEFAULT 0
    CHECK (lifetime_credits_spent >= 0),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- wallet_transactions (immutable ledger)
-- ---------------------------------------------------------------------------
CREATE TABLE wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  transaction_type text NOT NULL
    CHECK (transaction_type IN (
      'purchase',
      'promotional_credit',
      'control_contribution',
      'refund',
      'admin_adjustment',
      'chargeback',
      'expired_credit'
    )),
  amount bigint NOT NULL,
  balance_after bigint NOT NULL CHECK (balance_after >= 0),
  related_payment_id uuid,
  related_control_window_id uuid,
  related_contribution_id uuid,
  idempotency_key text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX wallet_transactions_user_created_idx
  ON wallet_transactions (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- admin_audit_log
-- ---------------------------------------------------------------------------
CREATE TABLE admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX admin_audit_log_created_idx ON admin_audit_log (created_at DESC);
CREATE INDEX admin_audit_log_admin_idx ON admin_audit_log (admin_user_id);

-- ---------------------------------------------------------------------------
-- Auto-create profile + wallet on signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_name text;
  final_name text;
  free_credits bigint := 1000;
BEGIN
  base_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'walker'
  );
  final_name := left(base_name, 24) || '-' || substr(replace(new.id::text, '-', ''), 1, 6);

  INSERT INTO public.profiles (id, display_name, faction, role, status)
  VALUES (new.id, final_name, 'neutral', 'player', 'active');

  INSERT INTO public.wallets (
    user_id,
    available_balance,
    lifetime_credits_added,
    lifetime_credits_spent
  ) VALUES (new.id, free_credits, free_credits, 0);

  INSERT INTO public.wallet_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    idempotency_key,
    metadata_json
  ) VALUES (
    new.id,
    'promotional_credit',
    free_credits,
    free_credits,
    'signup-grant-' || new.id::text,
    jsonb_build_object('reason', 'free_test_credits_on_signup')
  );

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER games_set_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER walker_state_set_updated_at
  BEFORE UPDATE ON walker_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER wallets_set_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
