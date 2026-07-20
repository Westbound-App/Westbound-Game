# WESTBOUND

> A man is walking across America. The internet can help him finish or pay to send him the wrong way. If he reaches the Pacific, the game ends forever.

One shared, permanent, real-time event. Server-authoritative walker. Crowd influence through structured control windows and prepaid credits.

**Current status: Phase B — local authoritative engine**

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Realtime later)
- Mock routing provider (replaceable interface)
- Dedicated game-engine worker (planned Phase B)

## Quick start

```bash
cd westbound
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase credentials, the live page uses **local fallback** sandbox data so UI work can continue.

### Connect Supabase

1. Create a Supabase project.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
3. Run migrations in order from `supabase/migrations/` (SQL editor or Supabase CLI):
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_seed_sandbox.sql`
4. Restart `npm run dev`.

## Repository layout

```
docs/                   Product + engineering docs
supabase/migrations/    SQL schema, RLS, sandbox seed
src/app/                Pages + API routes
src/components/         React UI
src/lib/config/         Central game configuration
src/lib/types/          Domain + DB types
src/lib/routing/        RoutingProvider abstraction + mock
src/lib/game/           Pure position/schedule helpers
src/lib/supabase/       Browser/server clients + middleware helper
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) | Product premise and Phase A scope |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Tables and integrity rules |
| [docs/GAME_ENGINE.md](docs/GAME_ENGINE.md) | Walker state machine and ticks |
| [docs/SECURITY.md](docs/SECURITY.md) | Auth, RLS, trust boundaries |
| [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) | Phased delivery plan |

## What works now

### Public experience (`/` or `/live`)

- **Full-screen cinematic live show** (temporary third-person walking video stand-in for the future 3D renderer stream)
- Lightweight overlays: LIVE badge, location, day, miles, progress, viewer count
- Decision actions only when a control window is open (Keep west / North / South)
- Expandable mini-map; “Watch only” hides UI
- Same backend state (coords, miles, status, contributions)

### Internal debug (`/admin/game-debug`)

- Previous dashboard: OSM map, character stage, Street View reference, full controls
- Engineering view only — not the public product

### Backend (preserved)

- Authoritative walker, sandbox speed, routes, wallets, control windows, tests

## Still mocked / not built

- Real-time photoreal 3D renderer / Unreal live feed
- Supabase multi-host multiplayer
- Real payments / Stripe
- Production Maine→Pacific route


## Scripts

```bash
npm run dev      # local Next.js
npm run worker   # optional background ticker
npm test         # unit tests
npm run build    # production build
npm run lint     # ESLint
npm run start    # serve production build
```

## Engineering rules (summary)

- Strict TypeScript; no casual `any`
- Server-authoritative game and wallet state
- Atomic credit operations with idempotency
- UTC in the database
- Routing and payments behind abstractions
- Do not claim mocked systems are complete

## License

Private / unreleased — all rights reserved unless otherwise specified.
