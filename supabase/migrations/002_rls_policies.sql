-- WESTBOUND Phase A — Row Level Security

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE walker_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
      AND p.status = 'active'
  );
$$;

-- profiles
CREATE POLICY profiles_select_public
  ON profiles FOR SELECT
  USING (status = 'active');

CREATE POLICY profiles_update_own
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY profiles_admin_all
  ON profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- games: public read; no client writes
CREATE POLICY games_select_all
  ON games FOR SELECT
  USING (true);

CREATE POLICY games_admin_write
  ON games FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- walker_state: public read; no client writes
CREATE POLICY walker_state_select_all
  ON walker_state FOR SELECT
  USING (true);

CREATE POLICY walker_state_admin_write
  ON walker_state FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- route_versions / segments: public read
CREATE POLICY route_versions_select_all
  ON route_versions FOR SELECT
  USING (true);

CREATE POLICY route_versions_admin_write
  ON route_versions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY route_segments_select_all
  ON route_segments FOR SELECT
  USING (true);

CREATE POLICY route_segments_admin_write
  ON route_segments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- game_events: public can read public visibility
CREATE POLICY game_events_select_public
  ON game_events FOR SELECT
  USING (visibility = 'public' OR public.is_admin());

CREATE POLICY game_events_admin_write
  ON game_events FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- wallets: owner only
CREATE POLICY wallets_select_own
  ON wallets FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY wallets_admin_write
  ON wallets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- wallet_transactions: owner read; no direct client insert
CREATE POLICY wallet_transactions_select_own
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY wallet_transactions_admin_write
  ON wallet_transactions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- admin_audit_log: admin only
CREATE POLICY admin_audit_log_admin_only
  ON admin_audit_log FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Note: Game engine worker and credit RPCs will use service role or
-- SECURITY DEFINER functions. Clients must not write walker_state or ledgers.
