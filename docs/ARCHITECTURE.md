# WESTBOUND — Architecture

## High-level system

```
┌──────────────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  Next.js Web             │────▶│  Supabase / local │◀────│  Game Engine       │
│  /  = cinematic LIVE show│     │  authoritative   │     │  Worker (Node)     │
│  /admin/game-debug       │◀────│  state           │────▶│  Single-leader     │
│    = engineering UI only │     └──────────────────┘     └────────────────────┘
└───────────┬──────────────┘                                      │
            │                                                     ▼
            │  temporary: looping cinematic video              RoutingProvider
            │  future:   live 3D renderer stream
            ▼
   Full-screen video feed + lightweight overlays
   (TikTok / YouTube can reuse the same feed)
```

**Rule:** The game engine / 3D renderer creates the live picture. The website displays it and handles participation. Do not use Street View as the public visual.

**Location fidelity:** Coordinates resolve to place packs + landmarks (`src/lib/places/`). Scene stills switch as he enters NYC, Akron, Grand Canyon, etc. Full continuous 3D world is the later renderer; see `docs/LOCATION_FIDELITY.md`.

## Principles

| Principle | Implementation |
|-----------|----------------|
| One shared world | Single `games` row with `environment = 'production'` for public; sandbox rows for testing |
| Server authority | Worker + API routes write game/wallet state; clients subscribe and interpolate |
| Time-based progress | Store segment, distance-into-segment, `movement_started_at`; recompute from UTC clocks |
| Provider abstraction | `RoutingProvider` interface; mock data in Phase A |
| Separation of concerns | Game engine ≠ React; payments ≠ wallet UI; routing ≠ map rendering |

## Runtime components

### 1. Web application (Next.js)

- **Server Components / Route Handlers** for authenticated mutations and SSR snapshots.
- **Browser client** for Supabase Auth session and Realtime subscriptions.
- **Middleware** refreshes auth session cookies.

### 2. Supabase

- **PostgreSQL** — canonical state, ledgers, history.
- **Auth** — email/OAuth users mapped to `profiles`.
- **Realtime** — broadcast walker snapshots, control windows, public events (not private wallet churn).
- **RLS** — least privilege; admin tables not client-writable.

### 3. Game engine worker (Phase B+)

Separate Node process (not the Next.js request path):

- Tick loop / scheduled advances
- Segment completion, rest schedule, decision windows
- Resolve control windows with deterministic tie-breaks
- Optimistic concurrency via `walker_state.version_number`
- Distributed lock / single-leader so two workers cannot double-advance

Phase A includes **types, config, and position helpers** only — no running worker yet.

### 4. Routing layer

```ts
interface RoutingProvider {
  calculateWalkingRoute(start, destination, waypoints?): Promise<RouteResult>;
  getValidDecisionOptions(current, destination): Promise<DecisionOption[]>;
}
```

Phase A: `MockRoutingProvider` + seeded geometry.  
Later: Mapbox / Google / OSRM behind the same interface.

## Client display model

1. Server publishes authoritative walker snapshot + `stateVersion` + `serverTimestamp`.
2. Client interpolates between confirmed points at configured speed.
3. On newer version, reconcile without hard teleports when possible.
4. If Realtime drops, poll `/api` or Supabase REST for snapshot.

## Data flow examples

### Contribution (future)

Client → `POST /api/control-windows/:id/contributions` → atomic wallet RPC → insert contribution → update option totals → Realtime broadcast.

### Walker tick (future worker)

Lock game → read state + route → compute elapsed walking time (schedule-aware, speed multiplier) → advance meters → write state if version matches → emit events.

## Repository layout

```
westbound/
  docs/                 # Product & engineering docs
  supabase/migrations/  # SQL migrations + seed
  src/
    app/                # Next.js routes (UI + API)
    components/         # React UI only
    lib/
      config/           # Central game configuration
      types/            # Shared domain types
      supabase/         # Clients (browser/server)
      routing/          # RoutingProvider abstraction
      game/             # Pure game logic helpers
  workers/              # (Phase B) game-engine process
```

## Environments

| Env | Purpose |
|-----|---------|
| `sandbox` | Restartable test game, free credits, speed multiplier |
| `production` | Canonical one-shot journey; `completion_locked` irreversible |

## Deployment (later)

- Web: Vercel or similar Next.js host
- Worker: long-running Node (Fly, Railway, ECS, etc.)
- DB/Auth/Realtime: Supabase project with backups and monitoring
