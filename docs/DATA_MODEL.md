# WESTBOUND — Data Model

All timestamps are stored in **UTC**. Display uses game or user timezone as configured.

## Phase A tables

### profiles

Extends Supabase `auth.users`.

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | = auth.users.id |
| display_name | text | Unique-ish public name |
| avatar_url | text nullable | |
| faction | text | `finisher` \| `drifter` \| `neutral` |
| role | text | `viewer` \| `player` \| `moderator` \| `admin` \| `super_admin` |
| status | text | `active` \| `suspended` \| `deleted` |
| created_at / updated_at | timestamptz | |

### games

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| slug | text unique | e.g. `sandbox-portland` |
| name | text | Public display name |
| environment | text | `sandbox` \| `production` |
| status | text | `not_started` \| `active` \| `paused` \| `completed` \| `archived` |
| start_latitude / start_longitude | double precision | |
| destination_latitude / destination_longitude | double precision | |
| destination_radius_meters | double precision | Default 100 |
| started_at / completed_at | timestamptz nullable | |
| completion_locked | boolean | Production: true after finish; blocks restart |
| current_route_version_id | uuid nullable FK | Active route |
| config_json | jsonb | Overrides of default game config |
| created_at / updated_at | timestamptz | |

### walker_state

One row per game (1:1).

| Column | Type | Notes |
|--------|------|--------|
| game_id | uuid PK FK | |
| status | text | WalkerStatus enum |
| latitude / longitude | double precision | Last finalized position |
| active_route_segment_id | uuid nullable | |
| distance_into_segment_meters | double precision | |
| total_distance_walked_meters | double precision | |
| original_route_distance_meters | double precision | Baseline |
| current_projected_remaining_meters | double precision | |
| current_speed_mps | double precision | |
| movement_started_at | timestamptz nullable | Start of current continuous walk |
| next_state_change_at | timestamptz nullable | Rest/window/etc. |
| version_number | bigint | Optimistic concurrency |
| updated_at | timestamptz | |

### route_versions

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| game_id | uuid FK | |
| version_number | int | Per-game sequence |
| reason | text | `initial` \| `detour` \| `reroute` \| `admin` … |
| source | text | `seed` \| `mock` \| `provider` |
| intervention_id | uuid nullable | Future FK |
| total_distance_meters | double precision | |
| encoded_geometry | text nullable | Polyline or GeoJSON string |
| is_active | boolean | |
| created_at | timestamptz | |

### route_segments

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| route_version_id | uuid FK | |
| segment_index | int | Ordered |
| start_latitude / start_longitude | double precision | |
| end_latitude / end_longitude | double precision | |
| distance_meters | double precision | |
| cumulative_start_meters / cumulative_end_meters | double precision | |
| pedestrian_allowed | boolean | |
| metadata_json | jsonb | Landmarks, street names |

### game_events

Public chronological feed.

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| game_id | uuid FK | |
| event_type | text | |
| title / description | text | |
| latitude / longitude | double precision nullable | |
| related_user_id | uuid nullable | |
| related_intervention_id | uuid nullable | |
| visibility | text | `public` \| `internal` |
| occurred_at | timestamptz | |

### wallets

| Column | Type | Notes |
|--------|------|--------|
| user_id | uuid PK FK | |
| available_balance | bigint | Credits; never negative |
| lifetime_credits_added | bigint | |
| lifetime_credits_spent | bigint | |
| updated_at | timestamptz | |

### wallet_transactions

Immutable ledger. Balance is derived and stored as `balance_after` for audit.

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| user_id | uuid FK | |
| transaction_type | text | See domain types |
| amount | bigint | Signed; positive credit, negative debit |
| balance_after | bigint | |
| related_* | uuid nullable | payment, window, contribution |
| idempotency_key | text unique | Per user scope in unique index |
| metadata_json | jsonb | |
| created_at | timestamptz | |

### admin_audit_log

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| admin_user_id | uuid FK | |
| action | text | |
| entity_type / entity_id | text / uuid | |
| before_json / after_json | jsonb | |
| reason | text | Required for high-risk actions |
| created_at | timestamptz | |

## Planned tables (not in Phase A migrations)

- `decision_points`, `control_windows`, `control_options`, `contributions`
- `interventions`, `payments`
- `faction_stats`, `user_game_stats`
- Worker locks / health heartbeats

## Integrity rules

- Wallet deductions must be atomic (RPC or single transaction with row lock).
- `walker_state.version_number` increments on every official write.
- Production `completion_locked = true` prevents status transition back to active via normal admin paths.
- Soft-delete profiles; never silently erase financial history.

## Indexes (Phase A)

- `games(slug)`, `games(environment, status)`
- `route_versions(game_id, is_active)`, `route_segments(route_version_id, segment_index)`
- `game_events(game_id, occurred_at desc)`
- `wallet_transactions(user_id, created_at desc)`, unique `(user_id, idempotency_key)`
