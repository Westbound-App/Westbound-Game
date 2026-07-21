# WESTBOUND — AI Photoreal Media Pipeline

How the live experience gets photoreal scenes of the same man and the same
dog, everywhere on the route, without a game engine.

## The idea

The backend stays authoritative (position, schedule, season, weather). The
visual layer is a library of photoreal stills and short video clips of the
Walker and Beacon, generated from the locked reference set in
`docs/CHARACTER_BIBLE.md`, staged for real places along the route. The site
resolves the best scene for the walker's current state and presents it as a
slow-TV live feed: video loops, gentle Ken Burns motion on stills, slow
crossfades as he travels.

```
authoritative state (lat/lng, season, time of day, weather, landmark)
        │
        ▼
scene resolver  ──►  media manifest (src/lib/media/manifest.ts)
        │                 stills + clips per biome/season/time/landmark
        ▼
/watch player  ──►  full-bleed slow-TV presentation + overlays
```

Already built: the manifest + resolver (with tests), the `/watch` player,
and `/api/renderer/snapshot` (state contract for generation tooling).

## Scene brief = prompt slots

Every generated scene combines:

1. **Character blocks** — verbatim from the character bible + reference images
2. **Camera block** — verbatim from the character bible
3. **Scene slot** — where/when, e.g.:

> …walking west on a two-lane rural road through dense pine forest near
> Sebago Lake, Maine. Mid-July, late golden hour, long warm shadows, hazy
> summer light. A weathered mailbox and a distant white farmhouse on the
> right. {16:9 | 9:16}

For video (Veo/Sora class tools): same prompt + "8-second continuous shot,
slow steady walking pace, gentle handheld feel, no cuts, ambient motion in
trees and grass."

## Coverage plan (don't generate all of America)

He walks ~20 miles a day; you always know weeks ahead where he'll be.
Generate just-in-time, ahead of the walker:

- **Corridor pack** (per ~50 route miles): 6–10 scenes — day / golden hour /
  dusk / night / rain variant / one rest scene, in the corridor's biome.
- **Landmark kits** (the viral moments): 3–5 scenes staged at a named place
  from the places registry ("passing Derby Downs, Akron"), pinned via
  `landmarkId` so they only ever show at that landmark.
- **Season/holiday overlays**: when the calendar changes, regenerate only
  the corridor ahead, not the archive behind.

Launch needs exactly one corridor: **Maine, summer** (6–10 scenes). That
replaces every placeholder on `/watch` for the start of the journey.

## Adding media (current manual flow)

1. Generate with your tools (ChatGPT/DALL·E, Google Imagen/Veo via the
   Ultra plan, or Midjourney) using the bible + references.
2. Run the QC checklist from the bible.
3. Drop approved files into `public/media/scenes/packs/<corridor>/`.
4. Add an entry to `SCENE_MEDIA` in `src/lib/media/manifest.ts` with the
   right biome/season/timeOfDay (and `landmarkId` for landmark kits),
   `source: "generated_locked"`, `label: null`.
5. Push — the site picks it up; specific entries automatically beat
   placeholders in the resolver.

Later: an admin upload page and API-driven generation keyed to the route
lookahead can replace steps 3–4.

## Honesty policy

- Placeholder media carries a visible "temporary placeholder scene" label
  (already wired via `label`).
- Public-facing copy describes the feed as an artistic live rendering of a
  real ongoing journey simulation — never as camera footage of real people.
- Never fake viewer counts or pretend a still is a live camera.

## Cost reality (order of magnitude)

A corridor pack is ~10 generations (plus rejects) — single-digit dollars on
current image APIs; video clips are the expensive part (roughly $0.10–0.75
per second across 2026 tools), so lead with stills + Ken Burns and add
video for hero corridors and landmarks. The whole Maine launch corridor
should cost less than a tank of gas.
