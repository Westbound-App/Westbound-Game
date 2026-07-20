# WESTBOUND — Game Engine

## Role

The game engine is the **only** process that advances the walker along route geometry. It is separate from Next.js page rendering. Phase A ships pure helpers and config; the dedicated worker process lands in Phase B.

## Walker status machine

```ts
type WalkerStatus =
  | "not_started"
  | "walking"
  | "approaching_decision"
  | "decision_window_open"
  | "rerouting"
  | "resting"
  | "paused_by_admin"
  | "temporarily_blocked"
  | "completed";
```

| Status | Movement | Notes |
|--------|----------|--------|
| not_started | No | Awaiting official start |
| walking | Yes | Progress from timestamps |
| approaching_decision | Yes (until hold point) | Prepare options |
| decision_window_open | May approach but not pass decision | Accept contributions |
| rerouting | No | Apply winning option |
| resting | No | Schedule-driven |
| paused_by_admin | No | Public log unless internal sandbox |
| temporarily_blocked | No | Provider failure; retry |
| completed | No | Terminal in production |

## Authoritative progress model

Do **not** store animation frames.

Store:

- Active segment ID
- Distance into active segment (meters)
- `movement_started_at`
- `current_speed_mps` (includes sandbox multiplier when applicable)
- `status`
- `next_state_change_at`
- `version_number`

### Position at time T

```
elapsed = walking_seconds_between(movement_started_at, T, schedule)
distance = elapsed * current_speed_mps
position = interpolate_along_route(active_segment, distance_into_segment + distance)
```

On each worker tick, if enough distance has been covered, finalize segments and persist a new snapshot.

## Daily schedule (prototype default)

Configurable; Phase A default:

- 8 hours walking / 16 hours resting per game day
- Sandbox may compress via `sandboxSpeedMultiplier` (default 100)

Production-shaped schedule (later config):

- Walk 08:00–12:00, rest 12:00–13:00, walk 13:00–17:00, rest overnight  
- Timezone from `gameConfig.gameTimezone`

## Control windows (Phase B+)

1. Walker nears eligible decision point (spacing ≥ `minimumDecisionSpacingMiles`).
2. Status → `approaching_decision` → options from `RoutingProvider`.
3. Open window for `decisionWindowDurationSeconds`.
4. On close: lock → sum credits → deterministic tie-break → intervention → new route version → resume.

### Tie-break (no randomness)

1. Higher total credits  
2. Higher unique contributors  
3. Earlier time of reaching final tied total  
4. Default / recommended route  

## Destination and completion

When distance from walker to destination ≤ `destinationRadiusMeters`:

1. Stop movement; set `completed`
2. Record `completed_at`, final distance
3. Disable control purchases
4. Set `completion_locked` on production games
5. Emit completion events; archive UI

Sandbox may reset. Production may not (via normal admin).

## Concurrency

```sql
UPDATE walker_state SET ..., version_number = version_number + 1
WHERE game_id = $1 AND version_number = $expected;
```

Zero rows updated → another leader won; retry safely.

Use a lease/lock table so only one worker advances a game.

## Failure modes

| Failure | Behavior |
|---------|----------|
| Routing provider down | `temporarily_blocked`; exponential backoff; no invented geometry |
| Worker crash | Restart recomputes from stored timestamps; distance not lost |
| Duplicate workers | Version check / lock prevents double movement |

## Phase A code map

| Module | Purpose |
|--------|---------|
| `src/lib/config/game-config.ts` | Defaults + types for all tunable rules |
| `src/lib/types/domain.ts` | WalkerStatus, Coordinate, snapshots |
| `src/lib/routing/*` | Provider interface + mock |
| `src/lib/game/position.ts` | Segment interpolation helpers |
| `src/lib/game/schedule.ts` | Walking vs rest time math |

Worker entrypoint: planned `workers/game-engine/`.
