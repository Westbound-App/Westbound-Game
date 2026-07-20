# WESTBOUND — Location Fidelity (how the world should feel)

## What you want (product truth)

People should get genuinely excited when he enters **their** area.

If the crowd walks him past **Akron Soap Box Derby**, the live view should feel like that hillside, hangar, and airfield energy — not a generic Midwest clip.  
If they send him to the **Grand Canyon**, it should feel like canyon country.  
If he hits **New York**, it should feel like New York.

It does **not** need every real house and storefront (Street View / photogrammetry of the whole US).  
It **does** need **recognizable place character**.

## Architecture (non-negotiable)

```
Authoritative game state          Visual layer
─────────────────────            ─────────────────────────────
lat / lng / heading       →      Place resolver
route + miles             →      Region + landmark packs
status (walk / rest)      →      Scene assets OR 3D world
                                  ↓
                         Continuous live picture
                         (later: Unreal / Cesium stream)
                         (now: place-pack stills / clips)
```

1. **Backend owns truth** — where he is, how far, which route.  
2. **Place system maps coordinates → “what should this feel like?”**  
3. **Renderer shows a continuous scene** for that pack (not jumping Street View panoramas).  
4. **Website / TikTok only display the feed + overlays.**

## Three fidelity layers

| Layer | What it is | When |
|-------|------------|------|
| **A. Place packs (now)** | Curated biomes + landmarks (NE town, NYC urban, Akron industrial, canyon, plains, Pacific). Still/clip + headline “Near Derby Downs”. | Prototype + early public |
| **B. Terrain + sky (next)** | Real elevation/satellite under a stylized or photoreal character (Cesium / Unreal). Region materials swap by pack. | Phase 3 start |
| **C. Landmark sets** | Hand-built or AI-assisted “Akron Derby” / “South Rim” kits: hangar silhouette, canyon shelves, skyline massing — *inspired by* real places. | Ongoing content |

## Landmark moments (the viral bits)

Store landmarks as:

- Name + headline  
- Lat/lng + radius  
- Biome / scene pack  
- Optional blurb for stream overlay  

When `distance(walker, landmark) < radius`:

- Switch scene pack  
- Overlay: **Near Derby Downs · Akron, Ohio**  
- Optional journey feed event: “He walked past Derby Downs”

Locals care about **named places**, not pure lat/lng.

## National route (not a loop)

Production:

- One continuous pedestrian-legal route Maine → Pacific  
- Progress from timestamps (already designed)  
- **No loop** — completion ends the game  

Sandbox:

- Short real route for engine tests **or**  
- **Scenic demo mode**: progress 0–100% samples visual waypoints (Portland → NYC → Akron → Chicago → Denver → Canyon → LA) so you can *preview* place packs before the full route exists  

Scenic demo is for **visual QA**, not the public production lie.

## Content pipeline for a new town

When someone wants “make Akron feel real”:

1. Add/adjust landmark entries (Derby Downs, Airdock, downtown).  
2. Art: one hero still + optional looping ambient clip matching third-person camera language.  
3. Optional: 3D kit (hangar massing, hillside, sky palette).  
4. QA: walker teleports or sandbox scenic pass through coords → pack switches cleanly.  

Repeat for every high-traffic city on the national route.

## What not to do

- Don’t stitch Street View for public live (jumps, frozen cars, no character in world).  
- Don’t one looping Portland video for the whole country.  
- Don’t put accurate GIS buildings before the **place feeling** works.  
- Don’t let the browser invent official coordinates.

## Success test

A viewer in Akron should say:

> “Wait — that’s basically Derby Downs / the hangars — he’s here.”

Not:

> “That’s a random highway that could be anywhere.”
