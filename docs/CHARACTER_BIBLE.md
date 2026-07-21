# WESTBOUND — Character Bible

The single source of truth for how the Walker and Beacon look in every piece
of generated media. **Consistency is the product**: viewers attach to *the
same* man and *the same* dog. Paste these blocks verbatim into every
generation, alongside the locked reference images.

## The Walker (display name configurable)

Copy this block into every prompt:

> A kind-faced American man in his early 40s, medium sturdy build, about
> 6 feet tall. Short brown hair greying slightly at the temples, light
> stubble, warm smile lines, blue-grey eyes. He walks with an easy,
> unhurried stride and looks genuinely happy to be outside. He is NEVER
> threatening, exhausted, or miserable.

Seasonal wardrobe (pick ONE per scene, keep every detail):

- **Summer**: light chambray hiking shirt with sleeves rolled once, khaki
  hiking pants, worn brown leather boots, olive-green 45L backpack with a
  tan bedroll strapped on top, dark green baseball cap, water bottle in the
  side pocket.
- **Fall**: same boots/pack/cap, faded red-and-charcoal flannel over a grey
  tee, dark khaki pants.
- **Winter**: same pack/cap silhouette, rust-orange insulated jacket, dark
  grey pants, light knit beanie replacing the cap, visible breath in cold
  scenes.
- **Spring**: light olive rain shell (open when dry), khaki pants, same
  boots/pack/cap.

The pack, boots, and cap are his identity anchors — never change them.

## Beacon

Copy this block into every prompt (from the product spec, expanded for
photoreal):

> Beacon is a slightly chunky, medium-large Bernese Mountain Dog × Siberian
> Husky mix. Predominantly black fluffy double coat with strong white
> markings: a white chest bib, white paws, a white tail tip, and a thin
> white blaze up the forehead. Subtle warm tan accents above the eyes and on
> the cheeks. His body structure leans Bernese — sturdy and soft — while his
> face carries playful Husky brightness. Amber-brown eyes, black nose,
> gently floppy ear tips. He walks FREELY beside or slightly ahead of the
> man — no leash, ever. Expression is happy, gentle, and alert. He is never
> aggressive, wolf-like, skinny, dirty, injured, or sad.

Optional seasonal accent: a tasteful bandana (autumn orange, winter red
plaid) — only when the scene is festive, never in plain travel scenes.

## Camera language

Standard scene (90% of media):

> Third-person view from behind and slightly above, the man and dog in the
> lower-middle of the frame walking away from camera down the road, faces
> not visible or in profile. 35mm cinematic framing, natural light, soft
> depth of field, documentary realism. No text, no watermarks.

Moment scenes (sparingly — rest stops, greetings, scenic overlooks) may show
profiles or three-quarter views. Avoid direct-to-camera eye contact; it
breaks the "we're following them" feeling and makes consistency harder.

Formats: generate 16:9 for the site and 9:16 for TikTok/mobile of every
approved scene.

## Hard prohibitions (from the product spec)

No weapons, violence, politics, protest imagery, injuries, distressed
animals, leashes on Beacon, other recurring characters, brand logos,
readable signage with wrong town names, horror tone, or gloom. Weather can
be moody (rain, snow, fog) but the feeling stays calm and safe.

## Reference-set workflow (do this once, before any scenes)

1. Generate 8–12 candidate hero images per character using the blocks above
   (backs, three-quarter backs, profiles; solo and together).
2. Pick the canon set: 3–4 images per character that feel exactly right.
3. Store them in `docs/references/` (walker/, beacon/, together/).
4. Every future scene generation attaches those references (all major tools
   support reference/character-consistency inputs in 2026).
5. QC every output against the checklist below before it ships.

## QC checklist (reject the image if any fail)

- [ ] Same backpack, boots, cap (or correct seasonal variant)?
- [ ] Beacon's white chest/paws/tail-tip/blaze all present, no leash?
- [ ] Exactly one man, one dog; no duplicate limbs/tails; no extra people
      in impossible positions?
- [ ] Season, weather, and light match the scene brief?
- [ ] No text artifacts, watermarks, or wrong-town signage?
- [ ] Feels calm, warm, and real — would a local recognize the vibe?
