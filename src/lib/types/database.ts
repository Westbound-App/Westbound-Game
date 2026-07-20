/**
 * Minimal typed shapes for Supabase tables used in Phase A.
 * Replace/generate with `supabase gen types` when the remote project is connected.
 */

import type {
  Faction,
  GameEnvironment,
  GameStatus,
  UserRole,
  UserStatus,
  WalkerStatus,
  WalletTransactionType,
} from "@/lib/types/domain";

export type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  faction: Faction;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

export type GameRow = {
  id: string;
  slug: string;
  name: string;
  environment: GameEnvironment;
  status: GameStatus;
  start_latitude: number;
  start_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  destination_radius_meters: number;
  started_at: string | null;
  completed_at: string | null;
  completion_locked: boolean;
  current_route_version_id: string | null;
  config_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type WalkerStateRow = {
  game_id: string;
  status: WalkerStatus;
  latitude: number;
  longitude: number;
  active_route_segment_id: string | null;
  distance_into_segment_meters: number;
  total_distance_walked_meters: number;
  original_route_distance_meters: number;
  current_projected_remaining_meters: number;
  current_speed_mps: number;
  movement_started_at: string | null;
  next_state_change_at: string | null;
  version_number: number;
  updated_at: string;
};

export type RouteVersionRow = {
  id: string;
  game_id: string;
  version_number: number;
  reason: string;
  source: string;
  intervention_id: string | null;
  total_distance_meters: number;
  encoded_geometry: string | null;
  is_active: boolean;
  created_at: string;
};

export type RouteSegmentRow = {
  id: string;
  route_version_id: string;
  segment_index: number;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  distance_meters: number;
  cumulative_start_meters: number;
  cumulative_end_meters: number;
  pedestrian_allowed: boolean;
  metadata_json: Record<string, unknown>;
};

export type GameEventRow = {
  id: string;
  game_id: string;
  event_type: string;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  related_user_id: string | null;
  related_intervention_id: string | null;
  visibility: "public" | "internal";
  occurred_at: string;
};

export type WalletRow = {
  user_id: string;
  available_balance: number;
  lifetime_credits_added: number;
  lifetime_credits_spent: number;
  updated_at: string;
};

export type WalletTransactionRow = {
  id: string;
  user_id: string;
  transaction_type: WalletTransactionType;
  amount: number;
  balance_after: number;
  related_payment_id: string | null;
  related_control_window_id: string | null;
  related_contribution_id: string | null;
  idempotency_key: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type AdminAuditLogRow = {
  id: string;
  admin_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  reason: string;
  created_at: string;
};

type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

/**
 * Loose Database shape for @supabase/supabase-js.
 * Prefer generated types once a project is linked.
 */
export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow>;
      games: TableDef<GameRow>;
      walker_state: TableDef<WalkerStateRow>;
      route_versions: TableDef<RouteVersionRow>;
      route_segments: TableDef<RouteSegmentRow>;
      game_events: TableDef<GameEventRow>;
      wallets: TableDef<WalletRow>;
      wallet_transactions: TableDef<WalletTransactionRow>;
      admin_audit_log: TableDef<AdminAuditLogRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
