# WESTBOUND — Unreal Day One (self-build path)

> **Status: deferred.** Per `docs/LIVE_JOURNEY_VISION.md` §5, phase one
> ships on the web scene library without Unreal. Keep this guide for the
> later renderer phase (or hobby exploration on the side).

You are the hands and eyes; Claude Code on your PC is the builder. This
guide takes you from nothing installed to **watching a photoreal character
walk down a forest road on your own machine**, before any real money is
spent. Spending gates: **$0 today → $30 for the sky → ~$350 for slice
assets → bigger decisions only after your eyes approve each step.**

## Step 0 — Hardware check (5 minutes, do this first)

On the Windows PC you plan to use: press the Windows key, type `dxdiag`,
press Enter, open the **Display** tab, read the GPU name.

- **Great**: RTX 4060 / 4070 / 4080 / 3080 or better → full speed ahead
- **Workable**: RTX 2060–3070, GTX 1080 → fine for the slice, slower
- **Not enough**: laptop Intel/AMD integrated graphics, GTX 1050/1060 →
  the slice will crawl; a ~$1,200–1,800 gaming PC is the fix (and the
  project needs a streaming machine later anyway)

Also confirm: 32 GB RAM ideal (16 GB workable) and **250 GB free disk**.

## Step 1 — Installs (start the big download first, it takes a while)

1. **Epic Games Launcher** → epicgames.com → download, create free account
2. In the launcher: **Unreal Engine tab → Library → Install Engine** —
   choose the newest 5.x release. This is the 60–100 GB download; start
   it and let it run while you do everything else.
3. **GitHub Desktop** — you already have it ✅
4. **Claude Code desktop** — you already have it ✅

## Step 2 — First light (the $0 proof)

When the engine finishes installing:

1. Launcher → **Launch** Unreal Engine
2. New Project → **Games → Third Person** → quality preset **Maximum**,
   Starter Content ON → name it `WestboundWorld`, put it in
   `Documents/WestboundWorld` → Create
3. First open takes a while (shaders compile). When the editor appears,
   press the green **Play** button and use WASD keys: **you are now
   controlling a fully animated character in real-time 3D.**

That character walking = the raw material of the whole vision. Everything
from here is dressing the world and replacing the mannequin with our two.

## Step 3 — Give Claude hands

1. Open **Claude Code** on that PC → open the folder
   `Documents/WestboundWorld`
2. Paste this kickoff prompt:

> This is the Unreal Engine 5 project for WESTBOUND. Read the full spec at
> https://github.com/Westbound-App/Westbound-Game/blob/main/docs/UNREAL_SLICE_SPEC.md
> and the character bible at
> https://github.com/Westbound-App/Westbound-Game/blob/main/docs/CHARACTER_BIBLE.md
> (reference images are in docs/references/ of that repo). We are building
> the vertical slice: one mile of photoreal rural Maine road, a
> MetaHuman-based walker and a Bernese-mix dog walking it continuously,
> follow camera, day/night, driven by polling
> https://harmonious-melba-73601b.netlify.app/api/renderer/snapshot.
> First: enable the Python Editor Script Plugin and Remote Control API
> plugin, verify you can run editor Python, then walk me through today's
> milestone — a forest road landscape the third-person character can walk
> along — doing everything scriptable yourself and giving me one clear
> manual step at a time for anything that needs the mouse.

That local session does the technical work from inside the project;
you click the things it can't.

## Step 4 — The $30 gate: golden hour

Buy **Ultra Dynamic Sky** on Fab (Epic's marketplace, linked from the
launcher; ~$30, the industry-standard sky/weather system). Add it to the
project (your local Claude session guides this). Set time of day to late
golden hour, stand the character on the road, and watch for one minute.

**This is your first vision test.** Photoreal light, real shadows, a
character walking through it. If this minute doesn't excite you, stop —
you've spent $30 and a weekend. If it does (it will), continue.

## Step 5 — The ~$350 gate: our characters

From Fab, with your local Claude session advising on each pick:

- **Environment**: search "forest road" / "rural road" / "New England
  biome" — want spline-based road tools, 4.5★+, recent UE5 version
- **Dog**: search "dog realistic animated" — MUST include an animation set
  (walk/trot/sit/idle) and ideally an animation blueprint; a
  Bernese-adjacent or retexturable breed; the coat gets recolored to
  Beacon's canon markings
- **Walker**: MetaHuman Creator (free, in-engine) styled to the reference
  set; hiking clothes/backpack from a props pack if needed

Then the local session builds the slice against the spec milestones
(M1–M4): the mile, the pair, the API wiring, the 10-minute capture.

## The decision ladder (your rule, encoded)

| Gate | Cost so far | You watch | Go / stop |
| --- | --- | --- | --- |
| First light | $0 | mannequin walks in 3D | felt real enough to continue? |
| Golden hour | $30 | photoreal light on the road | excited? |
| Our characters | ~$380 | the pair, walking the mile | **THE vision test** |
| Full world | hardware + time | slice streamed to the site | scale to the country |

If any gate fails, we stop there and rethink — that's the whole point of
the ladder. If the character gate passes, WESTBOUND is real and the rest
is production.
