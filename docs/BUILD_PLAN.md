# WESTBOUND — Build Plan

## Phase A — Foundation

- [x] Product and engineering docs
- [x] Next.js + TS + Tailwind scaffold
- [x] Supabase browser/server clients + middleware structure
- [x] Domain types + central game config
- [x] Routing provider interface + mock
- [x] SQL migrations for core tables + RLS skeleton
- [x] Sandbox seed (route, walker, game)
- [x] Live game page shell
- [x] Map placeholder
- [x] Admin diagnostics shell
- [x] README + `.env.example`

## Phase B — Authoritative engine loop (current)

- [x] Pure `tickWalker` engine (schedule + segments + completion)
- [x] Local file store (`.data/local-game.json`) for shared sandbox without Supabase
- [x] Tick-on-read via `/api/game/live` (progress without dedicated worker)
- [x] Optional worker process (`npm run worker`)
- [x] Client polling + live UI updates
- [x] Admin force tick / sandbox reset / worker health
- [x] Unit tests: position + tick (progress, pause, rest, complete)
- [ ] Supabase service-role writer (multi-server persistence)
- [ ] Supabase Realtime broadcast
- [ ] Distributed single-leader lock for multi-worker

**Exit criteria (local):** Two clients see the same position; progress continues with browsers closed and after server restart.

## Phase C — Control windows + wallets (local engine done)

- [x] Control window open at decision points (and admin force)
- [x] Free test credits on join (local player id)
- [x] Atomic contributions + idempotency + overspend protection
- [x] Deterministic resolve + tie-break
- [x] Detour applies new route geometry
- [x] Faction stats + event feed
- [x] MapLibre real OSM map
- [x] Unit tests (wallet, resolve, tick, position)
- [x] Supabase migration `004_control_windows.sql` (schema ready)
- [ ] Supabase-backed multi-host control path

**Exit criteria (local):** Multi-user free-credit interventions change the route and history.

## Phase D — Product surfaces (in progress)

- [x] Journey timeline page
- [x] Leaderboards (faction / credits)
- [x] How It Works
- [x] Account + wallet ledger
- [x] Admin force window / reset / tick
- [x] Street View road camera panel (key optional)
- [x] Real OSM map
- [ ] Pause/resume admin controls
- [ ] Polish + a11y pass

**Exit criteria:** Phase 1 MVP acceptance §28 items that do not require real payments.

## Phase E — Production readiness (Phase 2 product)

1. Real pedestrian routing provider
2. Maine → Pacific production route seed
3. Stripe bundles + webhooks + refunds
4. Bot protection, rate limits, fraud basics
5. Monitoring, backups, production deploy
6. Explicit production completion lock verification

## Phase F — Immersive renderer (Phase 3)

1. External visual client consuming state API only
2. Map/engine remain independent if renderer offline

## Recommended next step after Phase B (local)

**Phase C:** control windows + free-credit contributions + route change after detour win.

## Dependency decisions still open

| Decision | Options | Default assumption |
|----------|---------|-------------------|
| Map library | MapLibre, Leaflet, Mapbox GL | MapLibre (no token required for OSM) |
| Routing vendor | OSRM self-host, Mapbox, Google | Mock until Phase E |
| Worker host | Fly.io, Railway, same VPS as API | TBD by operator |
| Auth providers | Email magic link first | Email + optional OAuth later |
