# WESTBOUND — Look Development

North star: **every scene looks like one photographer followed the same man
and the same dog across America.** Realism comes from coherence — same
characters, same photographic grade, same light logic, scenery that matches
the real route — not from maximum resolution. Between "super real" and
"cartoon" sits our lane: *grounded documentary photoreal*.

## 1. The grade block (paste into EVERY generation, after the character blocks)

> Shot on a 35mm documentary camera, natural light only, soft realistic
> contrast, gentle warm color grade, slight atmospheric haze, muted true-to-
> life colors. Handheld documentary framing, believable imperfection. NOT
> glossy, NOT oversaturated, NOT HDR, NOT cinematic advertisement style,
> NOT fantasy lighting. Looks like a real photograph from a long walk.

**Album test (new QC rule):** put the newest image next to five approved
ones. If it doesn't look like the same photographer on the same trip —
reject it, even if it's beautiful on its own.

## 2. The connection kit (the shots that create attachment)

Walking shots prove the journey; **moment shots build the bond.** Generate
these as their own batch (Maine, summer, using references + grade block):

1. Beacon a few steps ahead, looking back at the walker, tail mid-wag
2. The walker crouched, patting Beacon's head, packs still on
3. Water break: collapsible bowl for Beacon, bottle for him, roadside shade
4. Both sitting at a scenic overlook, backs to camera, looking at the view
5. Evening campfire, Beacon lying with his head on the walker's boot
6. Beacon asleep at a campsite, walker reading a paper map in lantern light
7. The walker waving to someone on a porch (person distant/soft), Beacon alert and friendly
8. Beacon sniffing wildflowers at the road edge, walker waiting, smiling
9. Rain: both under the olive shell/tree canopy, cozy not miserable
10. Morning: lacing boots outside a small-town motel, Beacon stretching

These map to walker statuses the backend already tracks (resting,
scenic_stop, weather_rest) — the player will show them at the right times.

## 3. Real-place grounding (the "my town" engine)

For each corridor, generations get TWO reference sets: the characters AND
the actual place.

Workflow per ~50-mile corridor:
1. Trace the real route segment on Google Maps.
2. Screenshot 3–5 Street View frames of representative stretches and any
   named anchor (bridge, church, water tower, downtown block). These are
   internal references only — never published.
3. Generate scenes attaching character refs + place refs: "match this
   road's geometry, treeline, and character; no readable signage."
4. **Squint test:** put the generation beside the Street View frame. A
   local squinting should say "yeah, that's that road."

Anchors matter more than accuracy everywhere: nail the recognizable
landmark silhouettes, let the connective road be regionally-true generic.

## 4. Launch-corridor coverage matrix (Maine · summer)

| Slot | Status | Notes |
| --- | --- | --- |
| day | done | canon walking shot shipped |
| golden_hour | needed | warmest, most-shared light |
| dusk | needed | town lights coming on |
| night | needed | resting scene, campsite or motel, NOT walking |
| rain variant | needed | calm, cozy rain |
| rest moments | needed | pick 3–4 from the connection kit |

Fall/winter/spring walking shots are already shipped; their moment/time
variants follow the same matrix later.

## 5. Motion and sound (what makes it feel live)

- **Video loops (2–3 hero slots):** 8-second continuous shots, slow steady
  walking, no cuts — summer day + golden hour first. The player already
  prefers video and falls back to stills automatically.
- **Ambient audio bed:** birds/wind/gravel footsteps/the soft jingle of
  Beacon's collar tag, looped, muted by default with a tasteful unmute
  control. Sound is the cheapest realism multiplier we have.

## 6. Code upgrades unlocked by this content (built once assets exist)

- Status-aware resolution: walking → walking scenes; resting/weather_rest →
  moment scenes; night → resting scenes (never night-walking)
- Ambient audio layer with mute toggle + reduced-motion/audio respect
- Slow crossfade scene rotation within a slot (3–4 variants per slot so
  long viewing sessions don't feel static)
