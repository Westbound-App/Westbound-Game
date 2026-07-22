# WESTBOUND — Persistent Live Journey Vision

## Handoff for Claude Code

Read this entire document before changing the project. Treat it as the current
product vision and architectural north star for WESTBOUND. First inspect the
existing repository, current implementation, package structure, deployment
configuration, and documentation. Preserve working features and existing user
work. Do not rewrite the application blindly.

WESTBOUND should no longer be approached primarily as a conventional video
game. It is a **persistent, fictional live journey** presented through a public
website and eventually through continuous YouTube Live and TikTok Live
broadcasts.

The simple description is:

> A man and his dog are walking across America in real time. They keep moving
> whether anyone is watching or not. Anyone can open the website without an
> account and immediately watch their journey. Viewers can optionally pay to
> influence a limited set of safe actions, especially decisions that change
> the route and prevent the Walker from reaching the final destination.

The emotional experience matters more than traditional gameplay. WESTBOUND
should feel like viewers discovered a quiet, beautiful, always-running live
camera following two companions across the country.

---

## 1. Product identity

WESTBOUND is best described as a combination of:

- A 24/7 virtual livestream
- A slow, real-time journey across the United States
- An ambient digital companion experience
- A community-influenced road story
- A public spectacle with extremely light interactive mechanics

It is **not** intended to feel like:

- A level-based video game
- An open-world action game
- A character controlled directly with a keyboard or controller
- A screen full of menus, statistics, quests, or gaming HUD elements
- A Google Street View clone
- A fake Twitch interface
- A cartoonish mobile game

The Walker and Beacon are not avatars that viewers steer continuously. They are
living characters following their own journey. The audience watches, becomes
attached, and occasionally influences what happens.

The product should feel peaceful, cinematic, warm, slightly mysterious, and
real enough that someone checking the website in the morning wonders where the
pair reached overnight.

---

## 2. The foundational story

The Walker begins at the northern edge of Maine and travels across America on
foot at a believable human walking pace. Beacon, his dog, walks freely beside
him.

The journey is governed by a permanent server-side clock and route state. It
does not pause because the website is closed, nobody is watching, or a
deployment occurs. If ten people open the website at once, all ten must see the
same location, direction, weather context, and journey status.

The journey has a final destination. If the Walker reaches it, WESTBOUND ends
permanently. This is a central dramatic rule, not a temporary game-over screen.
The experience should never simply reset and start again.

Community interventions can change the route at valid decision points and
therefore extend or redirect the journey. The tension is not created through
violence or danger. It comes from the simple fact that the walk is always
progressing and can eventually end.

### Locked journey principles

1. Time continues on the server, not in a viewer's browser.
2. The Walker moves at a believable human walking speed.
3. Everyone observes one canonical journey.
4. The Walker can rest, sleep, eat, experience weather, and pause naturally.
5. Route changes occur only at plausible roads, intersections, or decision
   points; there is no teleporting.
6. The Walker and Beacon never knowingly enter unsafe or impossible terrain.
7. Arrival at the final destination permanently concludes the journey.
8. The state must survive deploys, browser refreshes, outages, and restarts.

---

## 3. The public viewing experience

No account should be required to watch.

Opening the homepage should immediately present the live WESTBOUND feed. There
should not be a marketing landing page standing between the viewer and the
experience. The journey itself is the homepage.

### Primary desktop composition

The central focus is a large cinematic 16:9 live scene showing the Walker and
Beacon traveling. The feed should dominate the screen.

Information should be restrained and layered around the feed rather than
competing with it. Useful supporting information may include:

- A small, unmistakable `LIVE` indicator
- Current local time for the Walker
- Approximate current location
- Current weather and temperature
- Today's distance
- Total distance traveled
- Current journey status: walking, resting, eating, sleeping, sheltering, or
  observing something
- A subtle route-progress or compass element
- A collapsible map showing the traveled path and current position
- A quiet activity log containing only meaningful recent events
- A single `Influence the Journey` action

The interface must not resemble a busy game HUD. The scene and the relationship
between the Walker and Beacon remain the product.

### Mobile composition

Mobile should prioritize a 9:16 rendition or intelligent crop of the same live
moment. Supporting data should collapse below or overlay lightly. The mobile
experience must feel native to the way people watch TikTok or livestreams, but
it should retain WESTBOUND's own identity.

### No-account behavior

Anonymous viewers can:

- Watch the feed
- See the current public journey information
- Open the map
- Review major recent events
- Share the current moment or WESTBOUND link
- Open the payment/action flow

An account should not become mandatory merely to make a payment. If accounts
are introduced later, they should provide optional benefits such as receipts,
supporter history, saved moments, recognition, or notifications.

---

## 4. What “live” means

WESTBOUND is a simulation, but it should behave like a livestream.

It does not require a unique AI-generated frame for every second of a
multi-year journey. That would be unnecessarily expensive and technically
fragile. Instead, the product can create the convincing illusion of a
continuous live camera by combining:

- A canonical server-side journey state
- Location-appropriate visual scenes
- Seamless walking loops and transitional clips
- Weather, daylight, season, holiday, and status variations
- A visual scene scheduler
- Occasional special moments and new generated media

The location shown in the visual feed and the canonical route position must
remain meaningfully aligned. It is acceptable for early versions to represent
the character's general surroundings rather than reproduce every exact house,
tree, and road marking. Never display a clearly identifiable wrong city or
false readable town sign.

### Visual realism hierarchy

Prioritize these in order:

1. The same Walker and the same Beacon
2. Correct season, time of day, and weather
3. Correct general regional atmosphere
4. Believable road and walking behavior
5. Exact local scenery when practical

Character consistency is more important than perfect geographic reconstruction.

---

## 5. Visual production strategy

Do not require Unreal Engine for the initial product. WESTBOUND should remain a
web application deployable through the existing GitHub and Netlify workflow.

### Phase-one rendering strategy

The first production-worthy version can use a curated library of high-quality
scene images, cinemagraphs, and looping video clips. The browser selects the
correct scene family based on live state and presents it with tasteful movement
and transitions.

Examples of subtle motion that can make the feed feel alive:

- A natural Walker and Beacon walking loop
- Slowly shifting camera movement
- Moving grass, leaves, snow, mist, or rain
- Changing light and cloud shadows
- Beacon briefly moving ahead, slowing, or looking toward the Walker
- Gentle parallax between foreground and background
- Crossfades at believable environmental transitions

Static AI images with crude CSS bobbing are not an acceptable final illusion.
For the earliest prototype, limited animation is acceptable only to test layout
and atmosphere. The architecture should allow real looping video assets to
replace placeholders without rebuilding the application.

### Later rendering options

The system should remain flexible enough to adopt better technology later:

- AI-generated looping video
- Google Street View or Maps Imagery Grounding
- Google Photorealistic 3D Tiles where licensing and coverage permit
- A future Project Genie developer API if Google releases one
- Higher-fidelity WebGL or Three.js scene rendering
- Server-rendered broadcast output

Do not hardwire the product to an unreleased Genie API, and do not force Unreal
Engine into the stack merely because the visual concept resembles a game.

---

## 6. Character consistency

The Walker and Beacon are the permanent stars. Viewers must feel that they are
watching the same man and dog every day.

The canonical reference package is stored under:

- `docs/CHARACTER_BIBLE.md`
- `docs/references/walker/`
- `docs/references/beacon/`
- `docs/references/together/`

The primary identity anchor is:

- `docs/references/together/canon-together-summer-walk-01.png`

Future generated scenes must attach the primary identity anchor, the most
relevant individual angle references, and the appropriate seasonal reference.
Generated travel scenes never become replacement identity references.

### The Walker

The Walker is a kind-faced American man in his early 40s with a sturdy,
outdoors-capable build. His canon appearance has youthful, ruggedly handsome,
contemporary country-outdoors leading-man energy. He must never drift into
looking old, threatening, broken down, or miserable.

His backpack, bedroll, boots, and cap silhouette are visual identity anchors.
Seasonal wardrobe changes must follow the Character Bible.

### Beacon

Beacon is a slightly chunky, fluffy Bernese Mountain Dog × Siberian Husky mix.
His structure is broad and Bernese-heavy, while his face has playful Husky
brightness. His white chest, four white paws, forehead blaze, and white tail tip
must remain consistent. He is never leashed.

Beacon is not background decoration. He should sometimes lead slightly, look
back, explore safely, rest nearby, react to weather, and create small emotional
moments with the Walker.

---

## 7. Day, night, weather, seasons, and holidays

The feed should reflect the Walker's local conditions rather than the viewer's
conditions.

### Time of day

Visual states should include:

- Sunrise preparation
- Morning walking
- Midday walking or rest
- Golden-hour walking
- Evening camp or lodging
- Nighttime sleeping/rest state

The Walker should not visibly walk nonstop for 24 hours. A believable daily
routine makes the simulation more emotionally convincing.

### Weather

Weather may be based on real data near the current canonical location, with
safety rules preventing implausible behavior. Rain, fog, wind, snow, heat, and
clouds can change the visuals and walking/rest schedule.

Weather can be moody, but WESTBOUND never becomes frightening or hopeless.

### Seasons

Seasons follow the calendar and the Walker's location. Wardrobe and landscape
must update together. The locked summer, fall, winter, and spring references
establish the approved appearance.

### Holidays

Holidays should be visible through tasteful, temporary details rather than
turning the experience into a theme park. Examples include distant decorations,
warm lights, a winter plaid bandana for Beacon, autumn accents, or a quiet
holiday rest moment. Avoid logos, copyrighted characters, political imagery,
or permanent wardrobe changes.

---

## 8. Viewer influence and payments

Watching is always free. Payment is for optional influence, participation, or
support—not basic access.

The payment layer should be provider-agnostic. The product may eventually
support:

- XRP
- FLR
- Other selected cryptocurrency
- Credit/debit cards
- Apple Pay or Google Pay where supported

Do not make cryptocurrency knowledge a requirement. The interface should make
each payment path understandable to an ordinary viewer.

### Possible viewer actions

Actions must be curated, finite, safe, and narratively meaningful. Examples:

- Vote or pay to choose between valid roads at the next intersection
- Redirect the Walker at the next safe route decision
- Request a scenic stop
- Trigger a short rest
- Let Beacon explore a safe nearby feature
- Sponsor a meal, campsite, lodging, or supply moment
- Trigger a friendly wave or thank-you moment
- Choose between two approved upcoming landmarks
- Activate a seasonal or celebratory moment

Do not allow arbitrary text commands to control the characters or environment.
Do not allow weapons, dangerous behavior, cruelty, politics, harassment,
teleportation, or actions that break the story.

### Transaction behavior

Every paid intervention requires a reliable server-side lifecycle:

1. The viewer chooses an available action.
2. The interface shows the price, timing, and exact effect.
3. Payment is initiated.
4. The backend independently verifies settlement or provider confirmation.
5. A verified action enters a canonical action queue.
6. The action executes at the next valid opportunity.
7. The public activity log shows an appropriate result without exposing private
   payment information.
8. The system prevents replay, duplicate execution, and conflicting actions.

Never trust the browser to mark a crypto or card payment as complete.

### Conflict and griefing rules

Multiple viewers may attempt incompatible actions. The backend needs an explicit
resolution policy such as:

- Time-limited community vote
- First fully settled eligible action
- Highest-supported option within a fixed window
- Queued choices for different future intersections

The policy must be transparent and should prevent a wealthy viewer from making
the experience nonsensical through constant rapid reversals. Route changes need
cooldowns and valid decision points.

---

## 9. YouTube Live and TikTok Live

The website is the canonical product. Social livestreams are distribution
channels for the same journey, not separate simulations.

A future cloud broadcast service should render a broadcast layout containing:

- The same current live scene
- A subtle WESTBOUND identity mark
- Current approximate location and status
- A QR code or short URL leading to the website
- Occasional approved event notices

The broadcast should run from cloud infrastructure. It should not depend on
Jonathan leaving a home computer or browser open continuously.

YouTube and TikTok eligibility, stream-key availability, automation rules, and
platform policies must be confirmed before launch. The architecture should
support RTMP or another standard output without making either platform a core
dependency.

---

## 10. Canonical state model

The backend should ultimately maintain one authoritative journey record. A
conceptual state model includes:

- Journey ID and lifecycle status
- Start time
- Current latitude and longitude
- Current route segment
- Direction/heading
- Walking speed
- Current movement status
- Last state-update time
- Distance traveled today
- Total distance traveled
- Current destination and terminal-condition state
- Next valid route decision points
- Current scene family/asset
- Local time and timezone
- Weather snapshot
- Season and holiday state
- Current queued action
- Recent public events
- Last sleep/rest schedule
- Stream health status

The browser should receive a safe public projection of this state. Private
provider credentials, wallet infrastructure, payment details, admin controls,
and anti-abuse signals must remain server-side.

The backend should derive current position from elapsed canonical time and
movement schedule rather than incrementing a browser counter. This allows the
journey to recover accurately after downtime.

---

## 11. Suggested web architecture

Respect the existing repository and current stack first. Do not replace the
framework solely because this document mentions an alternative.

A suitable architecture may include:

- Existing frontend framework deployed through Netlify
- Netlify Functions or another server-side API layer
- A persistent database such as Supabase/Postgres
- Scheduled server jobs for state reconciliation, daily planning, weather
  retrieval, scene scheduling, and stream monitoring
- Object storage or a CDN for scene images and video loops
- Real-time updates through server-sent events, WebSockets, Supabase Realtime,
  or efficient polling
- Server-side payment verification and webhooks
- An administrator-only control surface separate from the public experience

The application must not rely on browser `localStorage` as the source of truth.
Local storage may cache public state or preferences, but the canonical journey
belongs in the database.

### Reliability requirements

- Idempotent state updates
- Safe recovery after deploys or outages
- Immutable event/audit history for route and payment-triggered decisions
- Scheduled backups
- Rate limiting on public endpoints
- Secret management through deployment environment variables
- A kill switch for payments and interventions
- A pause/safety mode that preserves state without pretending the journey ended
- Health monitoring for the public feed and future social streams

---

## 12. Administrator controls

The public site should be simple, but an authenticated private control panel
will eventually be necessary.

Admin functions may include:

- View and correct canonical journey state
- Pause/resume walking for technical or safety reasons
- Approve or disable available viewer actions
- Review verified and pending payments
- Manage the action queue
- Select or override the current visual scene
- Schedule special moments
- Review stream health
- Trigger emergency fallback media
- Correct weather or regional classification
- Review the permanent audit log

Admin corrections should be explicit, logged, and protected from accidental
changes.

---

## 13. Visual and interface direction

The interface should resemble a premium nature documentary livestream more
than a software dashboard.

Desired qualities:

- Cinematic full-bleed imagery
- Warm natural colors
- Restrained typography
- Soft atmospheric overlays
- Minimal controls
- Clear but subtle live status
- A sense of distance and quiet
- Smooth transitions
- Excellent mobile presentation

Avoid:

- Neon gamer styling
- Oversized progress bars
- Dense cards and dashboard grids
- Cartoon buttons
- Fake chat clutter
- Constant popups
- Loud crypto branding
- Autoplay audio
- Excessive animation

Ambient audio can be offered as an opt-in feature later. Browsers generally
restrict autoplay audio, and visitors should never be startled by sound.

---

## 14. Privacy, safety, and geographic presentation

The site should show an approximate public location rather than presenting the
experience as a literal real human whose safety can be compromised.

Even though the characters are fictional, the product should avoid encouraging
viewers to locate or intercept them physically. Public location precision can
be reduced when appropriate. Do not imply that generated scenery is a live
security camera or guarantee that every visible object exists at that exact
location.

If real Street View or Maps imagery is used, comply with Google's terms,
required attribution, caching limitations, API security requirements, and
billing controls.

---

## 15. Phased build plan

Do not attempt to build the entire vision in one pass.

### Phase 1 — Prove the feeling

Build one excellent public live-feed page using the locked Walker and Beacon
references and existing assets.

The prototype should include:

- Dominant 16:9 live-scene area
- Responsive mobile layout
- LIVE status
- Approximate location
- Local time and weather presentation using mock or existing data
- Walking/resting status
- Today's and total distance
- A small collapsible map or map placeholder
- `Influence the Journey` button opening a clearly labeled preview panel
- Recent activity preview
- Seamless fallback/loop behavior

Use mock state initially if necessary, but isolate it behind a service or data
adapter so the real backend can replace it cleanly.

The goal is to answer one question: **Does opening WESTBOUND feel like watching
a real, peaceful journey already in progress?**

### Phase 2 — Make the journey real and persistent

- Create the canonical database state
- Move all journey calculations server-side
- Implement route progress and schedules
- Add real local-time and weather integration
- Add the public event history
- Make state survive deploys and downtime

### Phase 3 — Build the scene engine

- Scene manifest and asset metadata
- Selection by location, season, weather, daylight, and status
- Seamless video-loop support
- Transitions and fallbacks
- Character/scene QC workflow

### Phase 4 — Add controlled influence

- Action catalog
- Valid decision-point logic
- Queue and conflict resolution
- Preview-only test mode
- Admin controls

### Phase 5 — Add payments

- Begin with one payment provider and sandbox/test mode
- Implement server verification and idempotency
- Add transaction-to-action audit history
- Add cryptocurrency only through a carefully designed provider adapter
- Never activate real payments without explicit owner approval and end-to-end
  testing

### Phase 6 — Social broadcasting

- Build a cloud-renderable broadcast layout
- Add stream health monitoring and fallback media
- Connect YouTube Live first if appropriate
- Add TikTok Live after confirming account eligibility and automation policies

---

## 16. What Claude Code should do next

For the next implementation pass:

1. Inspect the complete repository and summarize the current architecture.
2. Identify what existing pieces support or conflict with this live-journey
   direction.
3. Confirm that the canonical visual reference files are present under
   `docs/references/`. If they are missing, stop and ask Jonathan to add the
   WESTBOUND canon reference package; do not create substitute characters.
4. Propose a narrow Phase 1 plan that preserves the current stack and Netlify
   deployment.
5. Implement the live-feed homepage shell with mock state only where needed.
6. Do not add Unreal Engine, Unity, a heavy 3D engine, cryptocurrency payment
   code, or production database migrations during this first pass.
7. Do not silently change branding, characters, journey rules, or the permanent
   ending condition.
8. Run the existing tests/build, visually inspect the desktop and mobile page,
   and report exactly what was changed.

When design choices are unclear, favor simplicity, emotional realism, and the
feeling of quietly observing a journey already underway.

---

## Final product test

WESTBOUND succeeds when a first-time visitor can open the page, understand it
within seconds without instructions, and feel compelled to check back later to
see how far the Walker and Beacon have traveled.

The strongest possible reaction is not, “This is a cool game.”

It is:

> “Wait—are they still walking? Where are they now?”
