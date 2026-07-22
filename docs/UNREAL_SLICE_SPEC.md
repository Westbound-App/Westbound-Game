# WESTBOUND — Unreal Engine Vertical Slice Specification

> **Status: deferred.** Per `docs/LIVE_JOURNEY_VISION.md` §5, the initial
> product does not require Unreal Engine — phase one is the web scene
> library. This spec is preserved as the later-phase renderer path.

The renderer decision is made: WESTBOUND's live view is a **real 3D world**
rendered in **Unreal Engine 5**, Red Dead / GTA-class presentation, driven
by the authoritative game backend. This document specifies the first
deliverable — the **vertical slice** — precisely enough to hand to a UE
contractor or to follow as a build guide.

## 1. What the slice is

**One mile of two-lane rural Maine road. The Walker and Beacon walk it,
continuously, lifelike, forever.** Camera behind and slightly above. Time
of day and weather change. State comes from the live backend. That's it —
no menus, no gameplay, no UI. If watching it for ten minutes feels like
quietly following a man and his dog down a real road, the slice succeeds
and the approach scales; if it doesn't, we learn that for a few thousand
dollars instead of a hundred thousand.

Non-negotiable feel requirements (from the product owner):

- Photoreal-leaning, grounded, believable — never cartoon, never low-poly
- The pair look like the canon reference set in `docs/references/`
  (kind man ~40s, green cap, chambray shirt, olive pack with bedroll;
  Bernese × Husky: black coat, white chest/paws/tail-tip, tan brows,
  free-roaming, NO leash)
- He never stops walking (the backend pauses him only for paid rests and
  route votes — the scene just obeys status)
- Beacon behaves like a real dog: beside, trotting ahead, looking back,
  sniffing — never robotic lockstep

## 2. Deliverables

- **D1 — UE 5.4+ project** in a Git repo (Git LFS), buildable on Windows
- **D2 — The scene**: ≥1 mile of road with looping capability (end
  connects seamlessly to start), New-England-style forest, roadside
  details (mailboxes, fences, poles), believable lighting
- **D3 — Characters**: MetaHuman-based Walker matching the reference set
  (seasonal outfit variants optional in slice; summer required); rigged
  dog matching Beacon's markings with walk/trot/sniff/sit/look-back
  animations and a simple behavior cycle
- **D4 — State integration**: the scene polls
  `GET /api/renderer/snapshot` (JSON over HTTPS, 1–5 s interval) and
  drives: walking vs resting, walking speed, time of day, season dressing
  (summer required, others stretch), weather (clear + rain stretch goal)
- **D5 — Camera**: smooth follow cam behind/above with subtle handheld
  drift; characters lower-middle of frame; 16:9 and 9:16 framing presets
- **D6 — Output**: runs at a stable 30+ fps at 1080p on a mid-range GPU;
  includes a 10-minute unedited capture as the acceptance artifact

## 3. The state contract (already live)

`GET https://harmonious-melba-73601b.netlify.app/api/renderer/snapshot`

| Field | Use in scene |
| --- | --- |
| `walker.status` | walking / resting / decision_window_open → animation state |
| `walker.speedMps` | walk-cycle playback rate (0 = stopped) |
| `walker.headingDegrees` | world orientation reference |
| `walker.totalDistanceWalkedMeters` | position along the loop (mod loop length) |
| `environment.timeOfDay` | day / golden_hour / dusk / night lighting rigs |
| `environment.season` | foliage + wardrobe set |
| `environment.settlementLabel` | optional debug overlay |
| `beacon.suggestedBehaviors` | dog behavior pool |
| `schemaVersion` | reject unknown versions |

Rules: the renderer NEVER invents official state, never moves the official
walker, and degrades gracefully (keep last state) when polling fails.

## 4. Asset shopping list (Fab / Unreal Marketplace)

| Item | Guidance | Typical cost |
| --- | --- | --- |
| Walker | MetaHuman (free) styled to reference set; backpack from a hiking props pack | $0–30 |
| Beacon | Realistic dog asset with animation set (retexture a Bernese/Australian-shepherd-class model to canon markings) | $30–80 |
| Environment | New England / rural road / forest biome pack (spline-based road tool strongly preferred) | $50–150 |
| Sky & weather | Ultra Dynamic Sky (industry default for day/night + weather) | ~$30 |
| Animation | Locomotion pack for natural human walk variants | $0–60 |

Budget ceiling for slice assets: **≈ $350**.

## 5. Hardware / software

- Windows 11 PC, RTX 4060+ (4070 recommended), 32 GB RAM, 250 GB free SSD
- Unreal Engine 5.4+ (free), Quixel Megascans (free with UE)
- Later, for the 24/7 stream: OBS on the same machine → RTMP; not part of
  the slice

## 6. Milestones & acceptance

- **M1 — Road & world (week 1–2):** walk-through of the mile with final
  lighting at day + golden hour. ✅ Screenshot-indistinguishable from a
  real New England road at a glance.
- **M2 — Characters (week 2–4):** the pair walking with follow cam.
  ✅ Matches reference set; Beacon varies behavior; no foot-sliding,
  no robot gait.
- **M3 — State-driven (week 4–5):** live API drives walk/rest, speed,
  time of day. ✅ Buying a rest on the website visibly stops them in
  under 10 s; rest end resumes them.
- **M4 — Polish & capture (week 5–6):** ambience (birds, wind, footsteps,
  collar jingle), 10-minute 1080p capture. ✅ The product owner watches
  the full capture and feels it.

## 7. Paths & budget

**Contractor (recommended):** UE generalist with environment + character
experience. Realistic quote for M1–M4: **$1,500–5,000** fixed-bid,
2–6 weeks. Where to look: Upwork (search "Unreal Engine environment
cinematic"), Fab community, r/unrealengine hiring threads.

**DIY (chosen path):** all of the above is achievable by a motivated
beginner with Claude Code running locally inside the UE project doing the
scriptable work. Start with `docs/UE_DAY_ONE.md` — it stages the build
behind $0 → $30 → ~$350 approval gates.

## 8. Copy-paste job post

> **Unreal Engine 5 vertical slice — photoreal walking simulation (fixed
> bid)**
>
> I'm building WESTBOUND, a live entertainment site where one character
> and his dog walk across America continuously. I need a UE5 vertical
> slice: one mile of photoreal rural Maine road (loopable), a
> MetaHuman-based hiker matching my reference images, and a
> Bernese-mix dog with natural behaviors (beside / ahead / sniff / look
> back), walking continuously with a smooth follow camera, day/night via
> Ultra Dynamic Sky, all driven by my existing REST API (poll a JSON
> endpoint for status/speed/time-of-day). Deliverables: UE project in
> Git LFS, stable 30 fps at 1080p on an RTX 4060, and a 10-minute
> capture. Full written spec, reference images, and the live API are
> ready today. Please quote fixed price and timeline for the milestones
> in the spec.

## 9. After the slice (context, not scope)

Scaling plan once the slice is approved: corridor-based world streaming
along the real route (GIS heightmaps + biome dressing per ~50-mile
corridor, landmark set-pieces for the "he's in MY town" moments), the
same snapshot API driving position; 24/7 OBS stream to the site
(replacing the photo player via the renderer-source abstraction) and to
TikTok/YouTube Live. The website, credits, votes, paid rests, and paid
waypoint detours (already live in the backend) need no changes — the
engine is a *view* over the same authoritative journey.
