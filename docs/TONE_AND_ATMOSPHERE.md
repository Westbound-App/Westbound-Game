# WESTBOUND — Tone, World & Atmosphere

## Emotional identity

WESTBOUND must feel **wholesome, calm, friendly, seasonal, and uplifting**.

It must **not** feel political, cynical, aggressive, dark, chaotic, or negative.

### Core feeling

> A kind, happy man walking across America with his dog, peacefully making his way west, while the world around him feels alive, warm, and welcoming.

Opposite of the stress people get everywhere else online.  
Something people leave on in the background because it is **peaceful and comforting**.

### Design test

Every major decision must pass:

> **Does this make WESTBOUND feel more wholesome, calm, kind, and comforting?**

If not, do not add it.

---

## Character

The walker is **not** a gritty survival character.

| He is | He is not |
|-------|-----------|
| Friendly, calm, positive | Angry, violent, cynical |
| Approachable, gentle | Hostile, aggressive |
| Resilient, curious, grateful | Exhausted-miserable anti-hero |
| Happy to be on the journey | A criminal / survivor in danger |

**Behavior (visual / future animation):** waves, smiles, looks around with appreciation, light acknowledgments to cars/people, relaxed body language, rests and enjoys overlooks.

**Never:** weapons, threats, dark humor, hostile interactions.

**Companion:** Beacon walks with him — playful, loyal, softens the whole frame.

---

## The kind-world America

People and towns are **friendly and simple**:

- Waves from porches, thumbs-up from joggers, kind honks  
- Shopkeepers greeting, kids waving  
- Seasonal decorations, welcoming downtowns  

**Never:** road rage, conflict, harassment, protests, political rallies, negativity-driven events.

Quiet is fine. Creepy emptiness is not. The world should feel **gently alive**.

---

## Language of influence (gameplay tone)

Viewers influence the journey — they do **not** “attack” him.

| Avoid | Prefer |
|-------|--------|
| sabotage, punish, trap, block | guide, scenic detour, nudge, support westbound route |
| Drifters as villains | Drifters as playful path-shapers |
| Finishers as warriors | Finishers as helpers keeping him on course |

Conflict is **gentle**, not hostile:

> People are influencing a friendly traveler’s journey, not hurting him.

---

## Seasonal system

The world evolves with:

1. **Real calendar** (season)  
2. **Geography** (latitude / region)  
3. **Weather pattern** (later)  
4. **Nearby holidays** (subtle, warm)

### Season visuals

| Season | Mood & details |
|--------|----------------|
| **Spring** | Fresh grass, blossoms, soft rain, cool mornings, hopeful tone |
| **Summer** | Lush green, strong sun, long days, people outside, warm evenings |
| **Fall** | Orange/red leaves, porch pumpkins, harvest stands, golden hour, cozy towns |
| **Winter** | **Location-dependent** — snow/ice in north & mountains; cooler + holiday lights in south (no fake snow everywhere) |

Winter is **not** identical nationwide.

---

## Holiday system

Broad, positive, family-friendly, **non-commercial**, **non-political**.

| Holiday window | Tasteful cues |
|----------------|---------------|
| Holiday / Christmas season | Lights, wreaths, lit trees, cozy dusk, snow only where climate fits |
| Halloween | Pumpkins, porch decor, warm autumn, cute not horror |
| Fourth of July | Flags, bunting, picnic energy, distant fireworks at night if ever |
| Thanksgiving season | Harvest decor, warm fall colors, welcoming towns |

Avoid satire, controversy, and divisiveness.

---

## Public experience

The live page is a **peaceful livestream**:

- Entertainment + relaxing background stream  
- Family-friendly shared event  
- Calm “slow media”  

A parent should feel fine leaving it on around a child.

Visual mood: uplifting road trip, scenic Americana, cozy realism — **not** grim, post-apocalyptic, harsh, or chaotic.

---

## Implementation map

| Concern | Where |
|---------|--------|
| Season / holiday from date + lat | `src/lib/atmosphere/season.ts` |
| Soft copy for options & factions | `src/lib/atmosphere/copy.ts` |
| Live overlay tone | `CinematicLive` |
| Seasonal stills | `/public/media/scenes/seasonal/` |
| Place packs still apply | `src/lib/places/` — season can soft-override scene |
