# Shipped features

Design/implementation record of what's in the game and why. Newest last within each
entry's follow-ups. Future ideas live in `BACKLOG.md`; art provenance in
`assets/ART_LOG.md`.

## Title screen (shipped 2026-07-20)

First scene now shown on load: `src/scenes/TitleScene.ts`, registered ahead of
`GameScene` in `main.ts`. Full-bleed hero art (`public/assets/sprites/title-bg.png`,
2560×1080 rooftop-at-dusk skyline, generated per `assets/ART_LOG.md`) plus a genuinely
non-animated pigeon overlay (`pigeon-perch-f{0,1,2}.png`, new standing/perched sprite
family — folded wings, planted feet, no flight silhouette) sit still for however long
the player looks, so the whole screen reads as one static painting. The same
tap/click/key that starts the game also triggers the reveal: the pigeon turns its head
through f0→f1→f2 to face the camera with the same conspiratorial smirk as GameScene's
post-hit glance, holds it, then the screen fades into `GameScene`. First leg of
BACKLOG's "Demo wrapping"; DAY 1 lettering, the auto day→dusk→night run, fly-to-roof,
and the cozy outro screen are still open.

**Logo + tagline localization (2026-07-20):** the "PIGEON DROP" title is now a
generated wordmark (`public/assets/sprites/title-logo.png`, chunky cartoon lettering
matching the game's outline/cel-shading style) instead of plain code text — kept as a
single fixed brand asset across all locales, the same way most games don't translate
their logotype. The subtitle tagline moved into `src/i18n.ts` (`t.tagline`, all 11
languages) instead of being hardcoded English, so every remaining piece of
title-screen text is either generated brand art or properly localized.

## Meter inversion — pressure economy (agreed 2026-07-14, core shipped 2026-07-14)

Shipped: digestion-pressure economy (passive fill 0.12/frame, poop drains), auto-blowout
at 100% with telegraph (wobbly flight from meter ≥ 92 + panic portrait; no sound yet),
scare-poop replacing damage entirely (D key debugs it — wire to real hazards later),
portrait as a pure prioritized state function with min-hold (battered → panic → strain →
pleased → ready; flicker fixed), and the gauge reimagined as a ring around the portrait
(cream → amber ≥ 70% → pulsing red ≥ 88%). New `portrait-panic` art logged in ART_LOG.

## Goo conforming to sprites — alpha-mask dripping (shipped 2026-07-14)

Implemented as designed: `src/goo/alphaMask.ts` extracts per-texture alpha silhouettes;
GooSim resolves stick/slide/detach against the mask (AABB stays broadphase, widened to
full sprite); GameScene syncs each collider's mask to the displayed frame, so reaction
frames shake hanging goo loose for free. Slow contacts perch on the silhouette instead
of AABB push-out.

## Altitude-hold flight model (shipped 2026-07-15)

Velocity trims toward an input-chosen target (climb −3.6 / hover 0 / dive +4.2 px/frame,
9%/frame approach): hands-off, the pigeon levels out and HOLDS its line (plus a visual-only
hover bob). DOWN arrow repurposed from redundant poop key to dive. Default cruise altitude
raised to y=150 (`START_Y`). Verified by `scripts/flight-shot.mjs`.

## Fire hydrant hazard (shipped 2026-07-15)

First real hazard wired to scare-poop (D-key debug path now has a sibling). Spawns on the
sidewalk every 9–17 s, cycles idle → warn (cap rattles, sputter drops, 65 frames of
telegraph) → burst: cap pops (`hydrant-1` frame) and a water jet erupts 280–350 px
(scare-dump + combo break + upward geyser kick, once per burst, `scripts/hydrant-hit.mjs`
regression-tests the collision). Hydrant is a sticky goo collider like victims, but scores
nothing.

**Tuned to force a dodge (2026-07-15):** height range was originally 190–300 px, which only
reached the default cruise line (`START_Y`=150) on ~31% of bursts — mostly a non-event. Now
280–350 px, chosen so the jet top (`capY - jetH`, `capY`=`GROUND_Y`-46=438) is *always*
≤158, comfortably above the cruise-line hit threshold (172) — every burst is a genuine
must-climb-to-dodge moment, not a coin flip. Upper bound (350) is capped so the ceiling
clamp (y=56) can still out-climb the tallest jet with ~10px to spare — always escapable if
you react to the warn telegraph.

**Water jet visual upgrade (2026-07-15):** replaced the code-only `fillRect` band loop with
a `water-col` sprite (seamless tileable texture, `assets/ART_LOG.md`) rendered as a
`TileSprite` — height driven by `jetH` every frame, `tilePositionY` scrolled continuously
for flow, so the shaft actually reads as moving water instead of static ribbed rectangles.
Topped with a `water-crown` splash sprite that scales in/out with the burst. Warn-state
sputter drops stayed as cheap procedural graphics circles.

**Guaranteed threat (2026-07-17):** the random idle→warn→burst cycle let some hydrants
scroll across without ever erupting (or erupt far from the pigeon). Replaced with a
position trigger: each hydrant bursts exactly once, warn starting when the scroll brings it
to pigeon.x + 230, so warn (65f) + burst (130f) always span the pigeon's x — verified the
jet is at full height precisely as the column crosses the flight line. `splashed` doubles
as the spent flag after the burst ends.

**Crown color match (2026-07-17):** the splash crown's blue droplets clashed with the
near-white foamy column; shipping `water-crown.png` rebuilt from the master desaturated
and brightened (see ART_LOG).

## Rainbow pickup (shipped 2026-07-17)

First pickup and the base pattern for future behavior-changing collectibles. A floating
rainbow spawns at varied altitudes and scrolls with the world; collecting it activates ten
seconds of rainbow-tinted goo, with a collection burst and HUD countdown. The old R-key
rainbow toggle is gone from player controls; `window.SP.setRainbow()` remains as a
debug/screenshot override, alongside deterministic pickup spawn/timer hooks.

**v2 art (2026-07-17):** token medallion replaced with a literal quarter-circle rainbow arc
(no dark outlines — it lives in the sky, deliberately softer than the ground props), swaying
gently instead of coin-spinning. See `assets/ART_LOG.md` for geometry and the agy-MCP
inspiration provenance.

**Happy victims (2026-07-17):** rainbow goo flips the victim reaction — each particle
carries a `rainbow` flag (kept pure-hue in the sim, skipping the brown marbling), and a
rainbow-flagged splat shows the `-rainbow` delight frame plus a positive line in green
instead of the outrage frame. Peds: FABULOUS! / SO PRETTY!! / HOT DIGGITY!; cars (added
same day): FREE PAINT JOB! / BEEP BEEP JOY! / LOVELY!!, with one extra suspension bounce.
The delight sprites (`ped-{0,1,2}-rainbow.png`, `car-{0,1,2}-rainbow.png`) were provided
externally — not logged in ART_LOG.

**Sprite proportions (2026-07-17):** pigeon scale 0.42 → 0.38, pedestrians/cars 0.5 → 0.58;
colliders and goo masks follow display size automatically. Pickup shrunk (scale 0.62 →
0.42) with a matching tighter collection hitbox.

## Goo impact and contour pass (shipped 2026-07-17)

Fast drops now sweep their full frame path in each moving collider's local space, so they
cannot tunnel through thin heads, arms, car roofs or windscreens between alpha-mask
checks. Victims resolve before the street, preventing the ground clamp from erasing a
drop's path through a low target. Fresh hits briefly cling and smear sideways, then seek
nearby opaque pixels as gravity pulls them down; goo follows shoulders and sloped bodywork
before detaching instead of immediately falling from the first transparent texel. Falling
drops stretch along their velocity and new contact patches squash across the surface.
`scripts/goo-hit.mjs` regression-checks single-frame high-speed impacts against both a
pedestrian and a car.

## Procedural victim colors (shipped 2026-07-17)

Pedestrian clothing now picks from eight colors at spawn through a custom Phaser WebGL
sprite pipeline. The shader recognizes each character's existing garment palette and
replaces it while preserving pixel luminance, so ink, skin, hair, props, highlights and
fold shading remain intact. The same palette follows normal, outraged and rainbow-delight
texture swaps without adding any sprite files or reaction-frame combinations.

**Car paint follow-up (2026-07-17):** generalized the pedestrian pipeline into one shared
victim-palette shader and packed the victim kind into the previously unused tint control
byte. Cars now choose from the same eight hues at spawn. Per-vehicle source palettes
select only the sedan, taxi, or van paint while retaining the sedan's mismatched door,
taxi checker/sign, van side panel, glass, chrome, wheels, lights, drivers, rust, and
shading. The tint also persists across angry and rainbow reaction textures.

## Food and special pickup roster (shipped 2026-07-18)

The complete pickup art roster now runs in the scene. Rainbow retains its independent
12–20 s rare spawn timer; bread, fries, kebab, chilli, coffee and the living pea pod share
a faster 5–9 s item timer, with a first item after 4.2 s. All pickups use the existing
altitude range, scroll/bob/sway behavior and collection hitbox. The old additive white halo
was removed entirely; the silhouettes now float cleanly against the sky.

Bread/fries/kebab immediately add +5/+8/+20 digestion pressure; kebab is the meaningful
jump while the two snacks are small top-ups. Coffee now activates an eight-second rush
that triples passive digestion. The pea pod activates an eight-second gas mode which
replaces liquid emission with translucent green vapour. Dedicated gas parcels leave as a
short downward/backward jet, expand, diffuse, become buoyant, curl in mild turbulence, and
follow the world's slipstream; their expanding cloud volumes can hit victims without ever
entering the goo simulation. A green timer bar tracks the remaining duration under the
portrait. Chilli's fire-poo behavior remains deferred. The
frightened pod swaps `pickup-pea-0`/`pickup-pea-1` every 18 normalized frames so only its
pupils dart left/right. `window.SP.spawnItemPickup(kind,x,y)` provides deterministic scene
testing.

**Engagement tuning (2026-07-18):** passive digestion slowed from 0.12 to 0.035 meter per
normalized frame (7.2 → 2.1 per second; empty-to-full now ≈48 s). Coffee raises that to
0.105/frame (6.3/s) for eight seconds. Pickup scale dropped 0.42 → 0.34 and the collection
half-extents followed from 40×38 → 33×30. Removed all pickup-name collection popups,
including rainbow; collection is communicated through the colored burst. Timed-mode text
was subsequently removed too: active rainbow and coffee durations now appear as compact,
text-free draining bars directly under the portrait (six-color rainbow strip, brown-to-gold
coffee strip), packed upward and hidden at zero. Verified in live Phaser: exact one-second
meter deltas 2.1/6.3, exact food gains 5/8/20, no pickup/effect text objects, readable pickup
silhouettes at the new scale, both timer bars visible together, and an empty meter graphic
after both effects expire.

**Spawn palette and gas follow-up (2026-07-18):** an always-visible compact `DEBUG SPAWN`
palette in the upper-right now produces pedestrians, cars, hydrants, and each pickup on
demand. The POD button lands a pod in the pigeon's pickup range; GAS directly exercises the
same eight-second gas state for quick visual testing.

## Ready portrait semantics (shipped 2026-07-18)

The old runtime `public/assets/portraits/normal.png` was semantically misleading: its
focused expression reads as “ready to poop,” not an idle neutral face. Renamed the unchanged
asset and texture key to `ready.png` / `portrait-ready`. After the pigeon runs dry,
`portrait-pleased` now persists for the entire `emptyLock` recovery window even after the
short relief timer expires. Crossing the existing meter-8 firing threshold clears the lock
and returns the portrait to `ready` after the normal anti-flicker hold. Historical
`images/normal.png` generation references remain named as originally recorded.

## Splat audio (shipped 2026-07-18)

The shipped wet splat SFX now plays when goo scores an accepted hit on a pedestrian or
car. Playback shares the existing per-victim hit cooldown, preventing dense blobs from
stacking many copies at once, and gets a subtle randomized rate so repeated impacts do not
sound mechanically identical. Gas hits remain intentionally silent. The initial v2 sound
was subsequently replaced with a tighter 0.17-second cut of the fuller third impact in the
user-supplied `splat-v3.mp3` master.

**Surface variants (2026-07-18):** ElevenLabs-generated car and asphalt one-shots expand
the set to three distinct impacts. Pedestrians retain the short wet v3 cut; cars get a
0.45-second hollow metal-roof splat; street landings get a dry 0.22-second slap. GooSim now
reports each particle's first street contact, and the scene applies an impact threshold plus
a 420 ms global cooldown so a fluid blob sounds cohesive instead of triggering an aggressive
row of samples. Pedestrian/car routing continues to share the existing per-victim cooldown.

**Gas and hydrant cues (2026-07-18):** gas-mode emission opens each stream with one comical
wet-heave/whoosh at natural rate (small random detune) and sustains a new seamless bubbly
sputter loop underneath for as long as the stream runs — however long the press — with a
130 ms fade-in and a 200 ms fade-out on release or gas expiry. The heave fires once per
press and rings out naturally; a quick re-press while it still sounds rejoins the loop bed
without stacking another retch. (This replaces the earlier rate-0.3 slowdown of the single
one-shot, which pitched the heave into a groan and fell silent after ~3.4 s.) A fire
hydrant now gives three gentle lid clinks as it enters `warn`, then starts the softer v0
high-pressure water bed on `burst` for the full visible column and fades it out as the jet
ends. The earlier harsh burst cue is no longer loaded. Both effects use the shared SFX bus.

**Klezmer transition (2026-07-18):** leaving the frantic combo tier now fades the klezmer
layer over 2.4 seconds while the sneaky layer returns on the original 0.9-second crossfade,
giving the energetic track a smoother tail without delaying the base music.

**Layered music phases (2026-07-19):** turned the unexpectedly good simultaneous phone
playback into the intended arrangement — two *pizzicatos*, not pizzicato + klezmer. Combo
0–1 keeps the sneaky pizzicato loop exposed; combo 2–3 layers the same pizzicato file over
itself offset by an eighth note, so the interleaved plucks double the perceived tempo with
no rate or pitch change; combo 4+ adds klezmer on top, swelling with the combo level (0.40
at x4 up to 0.58 at the x8 cap, loudness-compensated for its 3.6 dB hotter source). When
the combo breaks, klezmer no longer just fades off: it holds for two bars, then takes its
long 2.4-second release. Silent layers resync to the audible clock before fading in.

**Second pedestrian cast (2026-07-18):** added three new street victims: a tasteless
fake-luxury influencer, a hopelessly lost tourist dad, and a skipped-leg-day gym bro. Each
ships with walk, outraged splat, and delighted rainbow-reaction art plus character-specific
reaction lines. Pedestrian spawning now samples all six characters. The shared victim
palette control expanded from three to six source IDs, with isolated primary-garment masks
for the influencer's velour tracksuit, tourist's vacation shirt, and gym bro's tank/shorts;
existing pedestrians and the three car paint mappings remain in the same batched shader.

## Combo ranks — visual phase system (shipped 2026-07-19)

The visual half of the phase system the layered music started. The combo counter is
uncapped (score multiplier still plateaus at x8 behind the scenes); rank tiers derive
from the count in `src/ui/ranks.ts` with thresholds deliberately mirroring the music
layers — SPLAT! at x2 (echo pizzicato enters), DIRTY! at x4 (klezmer enters),
CRAPTACULAR! at x8 (klezmer max), SHITSTORM!! at x13 (prestige tier beyond the music) —
so every rank-up lands on an audible change. Conveyed almost entirely visually: the HUD
counter (now just `x12`, the word COMBO dropped) grows and recolors per tier
(amber → orange → red → hue-cycling rainbow) with a scale-punch on rank-up; the rank
name flashes once as a centered one-shot word and disappears; SHITSTORM enters with a
camera shake. Rank loss (2 s decay or hydrant scare-poop) takes the same diff path in
`updateHud`: the counter just reverts — the existing scare shake/damage portrait carry
the drama. Pure spectacle: no difficulty coupling. Debug: `SP.comboRank()` alongside
the existing `SP.setCombo`.

**Combo no longer dies mid-flight (2026-07-19):** the 2 s combo window measured time
between *hits*, but goo takes ~0.9 s to fall from cruise to road level — so leading a
car (the lowest target) routinely spent the whole window airborne and the landing read
as "hitting a car reset my combo" (a long-standing perception, not a rank-system bug;
verified: nothing car-specific ever zeroed the combo). Fix: the countdown freezes while
the stream is firing or any goo is still airborne (`GooSim.airborneCount`: free and not
yet grounded; exposed as `GuanoEffects.airborneGooCount`). Missed goo grounds within a
second, so decay resumes almost immediately — a dribble can stall the clock but costs
pressure, never builds rank.

**Complete miss breaks the chain (2026-07-19):** the airborne-freeze made whiffing free —
a missed volley just stalled the clock. Now goo volleys are judged as salvos: emission
arms one (`salvoActive`/`salvoHit` in GameScene), any victim contact — even during a
per-victim hit cooldown — marks it connected, and when the last particle resolves (stuck
or grounded, `airborneGooCount === 0` with emission stopped) a virgin salvo zeroes the
combo with a small grey "MISS…" popup (shown only when combo ≥ 2). Gas clouds drift too
loosely to judge and never arm a salvo. Side effect by design: an involuntary blowout
that hits nobody also wipes the chain — wasted pressure now has a score consequence.

**Mood vignette dropped (2026-07-19):** the initial release also tinted the screen edges
warmer per tier (radial-gradient overlay, pulsing at SHITSTORM). Cut same day: a reddish
filter over the scene read as a filter, not as the street heating up. The right way to
convey escalation is world *behavior*, not a screen effect — see the combo-rank world
reactions idea in `BACKLOG.md`. Text (counter + one-shot rank word) and the music layers
carry the phase for now.

## Empty-tank feedback — short lock + hungry-coo telegraph (shipped 2026-07-19)

Running the meter dry engaged a silent ~4 s lockout (`emptyLock` released only at
meter ≥ 8): holding poop did nothing and the only cue was the "pleased" portrait, which
read as "can't poop, no idea why". Fixed from both ends of the backlog's either/or:
the release threshold dropped to 3 (`EMPTY_LOCK_RELEASE`, ~1.3 s — still enough to stop
dribble-firing off a refilling tank), and squeezing an empty tank now telegraphs why,
throttled by `bellyRumbleCooldown` so a held button triggers it at most once per lock.
Side effect by design: holding poop on an empty tank now yields a tiny toot every
~1.4 s instead of ~4 s of dead input.

**Telegraph is sound-only (same day):** the first cut showed a grey "grumble…" popup
plus the irritated coo pitched up as a hungry stand-in. Both replaced within hours by a
dedicated generated SFX: `belly-rumble.{ogg,mp3}` (1.72 s empty-stomach gurgle, see
AUDIO_LOG), played at 0.55 × SFX bus with ±6% rate variance, cooldown 130 frames so it
never overlaps itself. Diegetic beats text — the belly complains, no popup needed.

**Hungry portrait (same day):** the telegraph also got a face. New `hungry` portrait
state (`public/assets/portraits/hungry.png`, Codex-generated, see ART_LOG): pleading
puppy-dog eyes, gaunt cheeks, wavy gurgle marks by the neck. Shown while poop is held
on an empty/locked tank (`squeezingEmpty` — the same signal that fires the rumble),
slotted between `strain` and `pleased` in the portrait priority so it beats the
post-dump relieved face but never masks real effort or damage states.

## Victim voice reactions — grumbles and honks (shipped 2026-07-19)

Hits on pedestrians and cars now sometimes get a voiced reaction on top of the splat:
irritated (`ped-grumble` — syllabic angry gibberish; `car-honk-angry` — beep-BEEP double
honk) or delighted when the goo is rainbow (`ped-delight` — rising woo-hoo cheer;
`car-honk-happy` — four-note melodic honk phrase). All four generated, see AUDIO_LOG.

Deliberately a garnish, not a soundtrack (backlog: "sound for *some* reactions"): only
the loud personalities vocalize (`VOCAL_PED_VARIANTS` = suit guy, granddad, gym bro;
`VOCAL_CAR_VARIANTS` = both sedans, the van keeps its "MY VAN!" text), a 55% chance roll
thins them further, and a single shared 2.5 s cooldown (`nextVictimVoiceAt`) means a
combo volley yields at most one voice. The voice trails the splat by 150 ms so it reads
as a reaction to the impact, not part of it, with ±8% rate variance. Per the backlog
intent, a voiced hit *replaces* that hit's text line popup (score popup stays); silent
hits keep their text lines. Verified headless: all six gating cases (irritated/joyful ×
ped/car, cooldown block, non-vocal variant) play the right key and suppress/show the
right popup.

**Per-character ped voices (same day):** one generic grumble/delight pair fit only the
granddad, so each vocal ped got its own pair — `ped-{grumble,delight}-{0,2,5}`: prissy
clipped yelp + posh "oooh" gasp (suit guy), gravelly mutter + wheezy hee-hee cackle
(granddad — grumble is the original master, cut down), deep dudebro growl + stoked
"yeah!" whoop (gym bro). All cut to ≤1.3 s so the shout still maps to a ped on screen,
and played quieter than before (per-file `PED_GRUMBLE_VOLUME`/`PED_DELIGHT_VOLUME`
tables — street voices are distant, and the tables also even out master loudness).
Generic pair removed from `public/`; masters kept as spares (see AUDIO_LOG).

**Audition round 2 (same day):** suit-guy delight sounded robotic and the bro whoop
strange — both regenerated with "natural human voice actor / organic, not synthesized"
prompt language and replaced. The influencer (ped 3, "NOT THE BAG!" / "CONTENT GOLD!")
joined the vocal set with her own pair: a whiny "ughhh"-scoff grumble (0.69 s) and an
"omg!"-style squeal delight (1.00 s). Vocal peds are now 4 of 6 (0/2/3/5); jogger and
tourist stay text-only. Round 3: the replacement bro whoop read as a karate kiai and
was regenerated once more into a laid-back "yeeeah brooo" flex cheer (1.45 s).

## Silent runoff — victim drips no longer click on the street (shipped 2026-07-19)

Goo that stuck to (or perched on) a pedestrian, car, or the hydrant and then dripped
down to the asphalt was re-triggering `sfx-splat-asphalt` on every landing — a heavy
hit shed dozens of trickling drops, i.e. a burst of clicks seconds after the actual
impact. Particles now carry a persistent `wasStuck` flag (set on glue *and* on
slow-contact perch, surviving unstick), and `onAsphaltSplat` ignores flagged particles:
the hit that put the goo there already made its noise, runoff lands silently. Direct
pigeon→street misses still click, unchanged (threshold + 420 ms cooldown). Verified
headless: a burst dumped on a ped produced runoff landings with zero asphalt plays,
while a straight street drop still played.

## The skater — fast high-value target (shipped 2026-07-19)

Backlog's top engagement item: ped variant 6, a smug inline-skater in a grape-purple
hoodie (art: 4-panel sheet via codex-image, see ART_LOG — stride A/B, outrage react,
rainbow delight; stride B needed one re-render because its legs initially duplicated
stride A's). He skates at own vx ±(2.5–3.5) vs walkers' 0.3–0.8, either direction —
rightward he outruns the 2.1 px/frame world scroll, so he enters from the LEFT edge
(new right-edge despawn added), making him the first target that crosses against the
traffic of the screen. Base score 40 vs a walker's 10: the lead is the skill test.
Two-frame stride animation (`ped-6` ↔ `ped-6-b`, ~⅓ s per leg via `SKATER_STRIDE_FRAMES`,
suspended during reactions) gives the leg-pumping speed read; he glides with half the
walker bob. Hit lines "DUDE, MY HOODIE!" / "RADICAL!!"; text-only for now (no voice pair
yet). `VictimPalettePipeline` SOURCE_CONTROLS re-spaced 6 → 7 values (all ped/car/accent
band thresholds updated); his hoodie recolor band uses the median purple sampled from the
shipped sprite (RGB 107/62/131, luminance ceiling 0.50 protects his skin). Verified
headless: all four frames on-street at correct scale, four distinct hoodie hues in one
batch, stride textures alternating at runtime.

## Day/night cycle + lantern & café night light (shipped 2026-07-19)

Two overlapping backlog items: time-of-day change, and "slight particles or
sprite-specific shaders — for lantern definitely, may be for café".

**The cycle** (`src/world/DayNight.ts`): day → dusk → night → dawn on a ~3 min loop
(day 58 s and night 52 s holds, 12–14 s smoothstepped crossfades). Four full procedural
sky paintings (`textures.ts`: existing day sky plus `sky-dusk` low fat sun + banded
clouds, `sky-night` starfield/full moon with craters, `sky-dawn` pink-lavender with the
sun rising in the day sky's spot so the crossfade reads as a climb) crossfaded by two
stacked images DayNight owns. Deliberately no full-screen tint overlay — the cut mood
vignette taught us that reads as a filter; the light lives in the objects instead:
per-look ambient color multiplies into everything via `setTint` (street, sidewalk, far
skyline, clouds, props, hydrant + jet, pickups, pigeon) and via a new `uAmbient` uniform
in both palette pipelines (buildings get the full scenery ambient, victims a gentler
actor ambient so gameplay stays readable at night — set once per frame through
`onPreRender`). The far skyline gets a `bg-far-lit` overlay canvas drawn in the same
generation pass (so windows sit on their buildings): ~half the homes light up warm,
sparse pinpricks on the distant row, red aircraft beacons on antenna masts — faded in
by `farWindowAlpha`. Backlog rule "no rainbow at night" implemented: the rainbow pickup
timer just re-arms until sunrise. Debug hooks `SP.setTimeOfDay(look)` / `SP.timeOfDay()`
/ `SP.spawnProp(key, x?)`.

**Lantern** (`src/world/LampFx.ts`): street lamps carry an additive warm halo + bright
core (`lamp-glow` radial texture) on the lantern head with a two-sine gas-lamp shimmer,
plus three moths spiralling in the light once the lamp is properly lit — all alpha-tied
to the DayNight glow value, invisible in daylight.

**Café** (`bg-building-2-lit.png`, procedural Pillow overlay built by Codex — pixel-
perfect window alignment by construction, see ART_LOG): emissive lit-windows sprite
ADD-blended over the facade by `NearBuildingsLayer` (no repaint pipeline on it — warm
light is warm on any paint job), alpha driven by `setGlow`. Storefront glows cozy amber
under the awning, upper windows dimmer per-window.

Verified headless at all four looks plus a mid dusk→night blend: day is pixel-identical
in spirit to before (lamps dark, no glows), dusk warms with lamps already on, night
cools the street while lamps/café/skyline windows carry the scene, dawn holds a faint
lamp afterglow. Both a forced café and a naturally spawned one glowed at night.

## Day/night follow-ups (shipped 2026-07-19, same day)

User feedback round: a dawn start was tried and rolled back same day — the session
starts in full daylight again (day → dusk → night → dawn), day one opens mid-morning.
New debug affordances to hop phases: a `TIME`
button in the `?debug` spawn palette and `SP.nextTimeOfDay()`, both jumping to the middle
of the next look's hold (`DayNight.jumpNext`). The night café overlay was revised after
in-game review: v1's storefront blew out to a near-white slab (additive core too bright
and too white — it erased the interior art) while the upper windows barely registered;
the rev drops the storefront core ~43%, shifts it to saturated amber #ffc878 with a 1px
frame inset so mullions stay visible, and raises the upper panes to ~75-80% of the new
storefront level. (Further rev: upper-pane chroma keying replaced with full-pane ROI
fills after fragments read unlit in-game; third hanging-lamp blob re-anchored onto its
actual lamp instead of the window frame.)
Final artifact round (user-spotted): the storefront's threshold keying had punched
hard-edged black holes in the glow wherever dark interior details sat (pastry trays,
shelves) — ground-floor panes rebuilt as full ROI fills like the upper windows, with
the interior detail mask instead dimming the glow to ~60% under a 2px blur, so shelves
and plants read as soft silhouettes in warm light rather than holes.
Debug spawn palette gained a `CAFE` button (`NearBuildingsLayer.queueNext`, also
`SP.spawnBuilding(key)`): forces a chosen facade as the next planned building, entering
from the right edge like any block (~4-6 s at parallax speed) instead of popping in.
Upper-window registration round (user-spotted): the box-shaped upper fills could never
fit the 3/4-view side face (panes there are skewed parallelograms) — left thirds stayed
cold while glow spilled onto stone. Fixed in a fresh Codex session with hand-traced
per-pane polygons (arch tops included), self-validated against a magenta outline trace
over the base art (`bg-building-2-lit-upper-trace-qa.png`) before shipping; storefront
output pixel-identical to the previous rev.

## Semantic street districts + true corner buildings (shipped 2026-07-21)

The near-building generator no longer treats every storefront as an interchangeable
`shop`. A Phaser-free street grammar (`NearBuildingsPlanner.ts`) assigns explicit uses
and placement roles, then holds one meaningful district for 2–3 blocks: café-centered
neighborhoods, gym/boutique active neighborhoods, business clusters, and continuous
canal-residential rows. Buildings inside a block sit shoulder-to-shoulder; larger gaps
and the three recolored connector types only mark real district boundaries.

The deep three-quarter café (`bg-building-2`) and tall gym (`bg-building-8`) are hard
right-corner endcaps. Each appears only after compatible infill, is never mirrored, and
is followed by a clear 78–118 px side street with no fence closing the view of its right
wall. Manual `SP.spawnBuilding()` requests now enqueue a valid semantic mini-block rather
than splicing a corner into arbitrary infill. All facades and connectors still use
`BuildingPalettePipeline`; each 2–3-block area shares a base palette with per-building
paint variation, while the café's warm ADD-lit overlay remains un-repainted.

Verified with 50,000 deterministic pure-planner blocks plus 2,000 live browser-planned
blocks: both corner invariants, district run lengths, gap/connector exits, scales, palette
controls, shader attachment, and the café night overlay passed. Live captures also checked
the full café, gym, office, and canal-residential compositions.

**Office variety + tighter canal rows (2026-07-21):** business districts gained two
new shader-ready frontal facades: `bg-building-14`, a tall rust-brick converted loft
office, and `bg-building-15`, a shorter wide cream-and-teal Art Deco office. Together
with glass offices 3/7, the sector now has four distinct silhouettes and material
families instead of alternating two similar towers. Semantic areas now last 2–3 blocks
instead of 2–4, and canal blocks are 3–4 houses instead of 3–5. Every normal canal
block guarantees a 2–3-building directly adjoining run; a calibrated -8 px overlap
cancels the sprites' transparent safety borders while keeping directional corner house
13 out of the forced joins. Verified over 50,000 planner blocks plus live office, canal,
alpha, pipeline, and controlled hue-sweep QA; full art provenance is in ART_LOG.

**Shorter offices + more cafés (2026-07-21):** business blocks now contain only
1–2 offices instead of 2–3, making the sector quicker to read and preventing a run
of tall facades from dominating the street. Two more shader-ready offices expand the
roster to six: `bg-building-16`, a low wide terracotta mid-century slab, and
`bg-building-17`, a narrow indigo neo-Gothic tower. Neighborhood café placement is
now guaranteed on the first area block and has a 52% chance on later blocks (about
70% of neighborhood blocks overall). A second cute right-corner endcap,
`bg-building-18`, adds a cobalt-tile patisserie with a curved copper cornice and
teapot sign; the planner selects both café designs evenly. A deterministic 50,000-
block check confirmed 1–2-building office blocks, near-even selection of every new
variant, and the café last-item/non-flipped/open-side-street invariants. Live Phaser
captures confirmed shared baselines and `BuildingPalettePipeline` on 16, 17, and 18;
the controlled hue sweep visibly repaints their saturated facade materials while
preserving glass, outlines, and neutral trim.

**Gym + boutique shader coverage (2026-07-21):** both gym facades (8/9) and the
boutique (10) were explicitly regression-tested through `BuildingPalettePipeline` at
hue controls -1 / 0 / +1. All three receive the shared per-instance tint path used by
homes, offices, cafés, and connectors. The resulting schemes visibly vary their broad
painted facade, awning, and sign materials while dark glazing, outlines, stone, and
structural trim remain legible; dedicated live captures are recorded in ART_LOG.

## Poo hits the fan (shipped 2026-07-21)

Cafés now bring a spinning pedestal fan onto the sidewalk. Animated wind ribbons show its
up-left airflow, and the matching widening force cone physically catches and bends airborne
goo while preserving the fluid simulation. A close pass awards a one-time `POO HITS THE
FAN!` trick-shot bonus per fan, counts as a successful volley, and can carry the same goo
onward into pedestrians or cars for a continued combo. `window.SP.spawnFan(x?)` and the
debug palette's `FAN` button provide deterministic testing.

**Real sprite + street scale (2026-07-21):** the code-drawn placeholder (which stood
nearly twice pedestrian height and clashed with the painterly style) was replaced by a
generated two-frame pedestal-fan sprite (`prop-fan-f{0,1}.png`, vintage steel/navy with
baked spin-blur disc; provenance in ART_LOG). The frames alternate to flicker the blur
streaks, the fan now renders at shoulder height (~58 px desktop, ×1.4 mobile), and the
wind cone/gust streaks emanate from the measured cage-hub point. Gusts were retuned to
start at the cage and fade downwind instead of popping in mid-flight.
