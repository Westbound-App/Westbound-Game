-- WESTBOUND Phase 2 — paid direct actions (rest gifts, waypoint sends)
-- Applied when using Supabase. Local engine already implements this logic.

-- The walk pauses only for paid rests: track the hold on the walker state
ALTER TABLE walker_state
  ADD COLUMN IF NOT EXISTS paid_rest_until timestamptz;

CREATE TABLE direct_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles (id) ON DELETE SET NULL,
  action_type text NOT NULL
    CHECK (action_type IN ('rest_break', 'waypoint_send')),
  credits integer NOT NULL CHECK (credits > 0),
  label text NOT NULL DEFAULT '',
  waypoint_latitude double precision,
  waypoint_longitude double precision,
  wallet_transaction_id uuid,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX direct_actions_idempotency_idx
  ON direct_actions (idempotency_key);
CREATE INDEX direct_actions_game_idx
  ON direct_actions (game_id, created_at DESC);

ALTER TABLE direct_actions ENABLE ROW LEVEL SECURITY;

-- Public may read the action history (it feeds the public journey feed);
-- writes go through the server only.
CREATE POLICY direct_actions_public_read
  ON direct_actions FOR SELECT
  USING (true);
