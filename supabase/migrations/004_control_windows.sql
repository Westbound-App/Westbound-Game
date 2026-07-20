-- WESTBOUND Phase C — control windows, contributions, interventions
-- Applied when using Supabase. Local engine already implements this logic.

CREATE TABLE decision_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  route_version_id uuid REFERENCES route_versions (id) ON DELETE SET NULL,
  route_segment_id uuid REFERENCES route_segments (id) ON DELETE SET NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  trigger_cumulative_meters double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'resolved', 'skipped')),
  estimated_arrival_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX decision_points_game_idx ON decision_points (game_id, status);

CREATE TABLE control_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  decision_point_id uuid REFERENCES decision_points (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'locked', 'resolved', 'cancelled')),
  opens_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  resolved_at timestamptz,
  winning_option_id uuid,
  resolution_json jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX control_windows_game_status_idx ON control_windows (game_id, status);

CREATE TABLE control_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  control_window_id uuid NOT NULL REFERENCES control_windows (id) ON DELETE CASCADE,
  option_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  faction_affinity text NOT NULL DEFAULT 'neutral'
    CHECK (faction_affinity IN ('finisher', 'drifter', 'neutral')),
  additional_distance_meters double precision NOT NULL DEFAULT 0,
  destination_waypoint_lat double precision,
  destination_waypoint_lon double precision,
  route_preview_geometry text,
  total_credits bigint NOT NULL DEFAULT 0 CHECK (total_credits >= 0),
  contributor_count integer NOT NULL DEFAULT 0 CHECK (contributor_count >= 0),
  is_valid boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  last_lead_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX control_options_window_idx ON control_options (control_window_id);

ALTER TABLE control_windows
  ADD CONSTRAINT control_windows_winning_option_id_fkey
  FOREIGN KEY (winning_option_id) REFERENCES control_options (id)
  ON DELETE SET NULL;

CREATE TABLE contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  control_window_id uuid NOT NULL REFERENCES control_windows (id) ON DELETE CASCADE,
  control_option_id uuid NOT NULL REFERENCES control_options (id) ON DELETE CASCADE,
  credits bigint NOT NULL CHECK (credits > 0),
  wallet_transaction_id uuid REFERENCES wallet_transactions (id) ON DELETE SET NULL,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX contributions_window_idx ON contributions (control_window_id);

CREATE TABLE interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  control_window_id uuid REFERENCES control_windows (id) ON DELETE SET NULL,
  winning_option_id uuid REFERENCES control_options (id) ON DELETE SET NULL,
  route_version_before uuid REFERENCES route_versions (id) ON DELETE SET NULL,
  route_version_after uuid REFERENCES route_versions (id) ON DELETE SET NULL,
  miles_added double precision NOT NULL DEFAULT 0,
  winning_faction text
    CHECK (winning_faction IN ('finisher', 'drifter', 'neutral')),
  applied_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  public_summary text NOT NULL DEFAULT ''
);

CREATE INDEX interventions_game_idx ON interventions (game_id, applied_at DESC);

CREATE TABLE faction_stats (
  game_id uuid NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  faction text NOT NULL CHECK (faction IN ('finisher', 'drifter')),
  credits_spent bigint NOT NULL DEFAULT 0,
  windows_won integer NOT NULL DEFAULT 0,
  miles_added double precision NOT NULL DEFAULT 0,
  miles_prevented double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (game_id, faction)
);

-- RLS
ALTER TABLE decision_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faction_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY decision_points_select ON decision_points FOR SELECT USING (true);
CREATE POLICY control_windows_select ON control_windows FOR SELECT USING (true);
CREATE POLICY control_options_select ON control_options FOR SELECT USING (true);
CREATE POLICY contributions_select_own ON contributions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY interventions_select ON interventions FOR SELECT USING (true);
CREATE POLICY faction_stats_select ON faction_stats FOR SELECT USING (true);

-- Writes via service role / RPCs only for financial mutations
CREATE POLICY decision_points_admin ON decision_points FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY control_windows_admin ON control_windows FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY control_options_admin ON control_options FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY interventions_admin ON interventions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY faction_stats_admin ON faction_stats FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
