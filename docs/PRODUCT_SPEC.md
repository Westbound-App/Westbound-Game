# WESTBOUND — Product Spec (Foundation Phase A)

## One-sentence premise

> A kind man and his dog are walking west across America. You can help keep him on course—or gently guide a scenic detour. If he reaches the Pacific, the journey ends forever.

## Tone

Wholesome, calm, friendly, seasonal, family-friendly. Influence is playful, never hostile.  
Full rules: `docs/TONE_AND_ATMOSPHERE.md`.

## Companion

He does not walk alone. **Beacon** — a Bernese Mountain Dog × Siberian Husky mix — walks with him and around him.

- Mostly black with white chest, paws, and muzzle  
- A little chunky (more Bernese body)  
- Playful husky expression  
- Configurable name/description in game config (not a second controllable character)

## Core product

WESTBOUND is a single shared, permanent, real-time event. One virtual walker moves along legitimate pedestrian routes from northern Maine toward a Pacific destination. All visitors see the same man, location, route, and clock.

Players influence him during structured control windows using prepaid game credits:

| Side | Goal |
|------|------|
| **Finishers** | Help him reach the Pacific |
| **Drifters** | Delay, detour, and prevent arrival |

When the production walker enters the destination radius, the live game **permanently ends** and becomes a read-only historical archive. There is no reset, second life, or automatic season.

## Non-negotiable principles

1. **One shared world** — One canonical production game; no private sessions for ordinary players.
2. **Server-authoritative state** — Browser never determines location, balances, winners, or routes.
3. **Permanent persistence** — Progress continues offline, across restarts, and without active browsers.
4. **Fair interference** — Only valid system-generated options; no arbitrary coords or joystick control.
5. **The ending is real** — Production completion is locked and irreversible via normal admin tools.

## Phase strategy

| Phase | Focus |
|-------|--------|
| **1 — Browser prototype** | Persistent walker, map, test route, factions, free credits, control windows, admin, sandbox speed |
| **2 — Nationwide + payments** | Maine→Pacific route, routing provider, Stripe, fraud, production deploy |
| **3 — Immersive presentation** | 3D walker, terrain, weather, livestream camera — state still owned by backend |

## Phase A scope (this foundation)

**In scope**

- Product/engineering documentation
- Next.js + TypeScript + Tailwind scaffold
- Supabase client/server wiring and auth structure
- Initial DB migrations (core tables + RLS skeleton)
- Shared domain types and central game config
- Seeded sandbox game with short mock route
- Basic live-game page, map placeholder, admin diagnostics page

**Out of scope (explicitly deferred)**

- Real payments / Stripe
- Nationwide routing
- Control-window contributions UI (schema later)
- Game-engine worker process
- Unreal/Cesium immersive renderer
- Chat, UGC, achievements, live weather, AI story

## Emotional and visual direction

Mood: lonely highways, long horizons, road-trip photography, weathered maps, quiet tension, internet-event energy.

Palette (see `globals.css`): midnight navy, warm off-white, map tan, rust red, asphalt gray, muted forest green, golden sunset.

Avoid casino styling, cartoon coins, slot effects, and generic SaaS chrome.

## Primary user journeys (target after Phase 1)

1. Open site → immediately see where he is and whether he is walking.
2. Register → receive free test credits → choose Finisher or Drifter.
3. During a control window → spend credits on a valid option.
4. Watch totals update live → see result and route change in history.
5. Admin → pause/resume sandbox, grant credits, inspect worker health.

## Success criteria (Phase 1 MVP — not all required for Phase A)

See master brief §28. Phase A establishes the foundation required to implement those criteria.
