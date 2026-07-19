# Backlog

Future ideas and agreed-but-unbuilt work. Shipped features move to `CHANGELOG.md`.

## Next up — engagement follow-ups (reprioritized 2026-07-18)

Food pickups now supply the missing **pull** and complete the basic meter economy (see
CHANGELOG). The remaining engagement gap is score-chain spectacle and higher-skill target
variety. The hydrant already covers the dodge verb; a second hazard adds threat variety but
no new decisions. Ordered by payoff-per-effort:

1. **Combo ranks** (zero assets, pure code): uncap the x8 combo counter in `onSplat()`;
   keep the score multiplier plateauing at x8 behind the scenes. Rank thresholds on
   combo count (e.g. 3/6/10/15) show Splat! → Dirty! → Craptacular! → SHITSTORM in the
   HUD with escalating style (size/color, scale-punch on rank-up, small shake at
   SHITSTORM). Scare-poop already zeroes the combo — wiping a high rank makes the
   hydrant retroactively matter.
2. **Skater** (high-value fast target, skill ceiling for aiming): ped variant 3 with own
   vx ~2.5–3.5 (vs 0.3–0.8 walkers), either direction, base score 40; extend
   `PED_LINES` / `PED_LINES_RAINBOW`; verify `VictimPalettePipeline` variant packing
   handles a 4th ped. Will require two sprites to show that it's moving legs, left in front, then right in front, will give speed feeling.

**Next asset set:** skater sheet (`ped-3` / `ped-3-r` / `ped-3-rainbow`, matching the
pedestrian sheet layout) via the codex-image → `ART_LOG.md` pipeline. Deferred to later
slices: turbo pigeon set, open-beak blowout frame, terrified portrait, audio.

## Meter economy — remaining work (agreed 2026-07-14; core shipped, see CHANGELOG)

- **Open-beak flight sprite** for the blowout telegraph (portrait + wobble only for now)
  + sound.
- Ties into turbo (below): turbo spends meter as rocket fuel — one resource governs
  ammo, boost, and comedy.

## Turbo / rocket guano (noted 2026-07-13, user idea)

Guano as explicit accelerator: holding the poop stream propels the pigeon like a rocket
(thrust opposite the stream), with turbo particle effects (exhaust flames/steam mixed
into the goo emission) and a **dedicated turbo pigeon sprite variant** (strained body,
swept-back wings, motion-blur feathers). Design the sprite set so pose variants like
this slot in alongside the normal flight frames.

## Fire hydrant follow-ups

- Peds reacting to the water; hydrant splash puddle; sound; terrified portrait cue
  during warn.

## Idea dump (user, 2026-07-17)

**Targets & scoring**
- Currently with the low bar we cant poop; we should either still be able to poop (make no-poop range very loww) or should telegraph it visually and by sound (e.g. hungry or impatient pigeon and koo)
- Objects to dump on, e.g. statues (static targets — presumably score less than moving
  victims, or hold a persistent goo coat).
- Higher-value fast targets: quick rollerblader/skater — harder lead, bigger reward.
- Higher-altitude targets: rooftop party.
- Combo ranks instead of the x8 cap (too boring): let the combo climb and show DMC-style
  rank names as it grows — our shitting ones, e.g. Splat! → Dirty! → Craptacular! →
  SHITSTORM. Ranks are the reward/spectacle; multiplier can keep scaling or plateau
  behind the scenes.
- Chain reactions to create chaos? (one splat triggers the next — startled ped stumbles
  into a car, honk scares more peds…)
- **Character interactions:** matching or compatible pedestrians occasionally pause when
  they meet and play a short paired gag before continuing. Examples: two gym bros stop to
  out-flex each other; two granddads lean on their canes and gossip. Also use sound for the gossip. Use proximity plus a
  per-character cooldown so interactions stay surprising and do not jam pedestrian flow.

**Sounds**
- Sound for character interation (once done)
- Sound for some of pedestrain and car reactions - should replace text pop-ups
- Goo drop is too much of a clickign sound (especially on asphalt - car is good, pedestrains is acceptable)
- Different Koos! We have one irritated for hydrant collision -add super relaxed one after very long successful dump, add one hungry one for telegraphing that we cant poop (or for that reuse from splash)

**Pickups**
- Special pickup effects (assets, spawning and collection are shipped): coffee =
  accelerated meter and frightened pea pod = gas replacement mode are shipped; chilli =
  explosive burning/fire poo remains. Rainbow behavior is already shipped.
- **Reconsider pea-pod gas targeting:** the current buoyant cloud looks good but rises
  before it can reliably reach pedestrians. Possible later redesign: emit a forceful
  downward turbo jet of gas that remains concentrated until it hits the ground, then
  disperses and rises using the current cloud physics. Decide whether that added ground
  targeting and propulsion is preferable to keeping gas as an intentionally aerial effect.

**World & level design**
- Natural habitat points - e.g. extra building "gym" plus then a lot of bodybuilders near it
- stationary victims, e.g. people sitting in from of the caffe (caffe building exists already)
- Higher platforms / screen layers — e.g. flying at balcony level, vertical screen
  transgressions beyond the single street lane.
- Occasional events, e.g. a Politiker motorcade (or different levels/themes entirely).
- Window washer (mid-air platform/victim on a suspended cradle).
- Drones (airborne hazard or target at flight altitude).
- Sunrise/day/sunset/night change - also effects characters (e.g. adding stationary hooker near a lamp at midnight, robberer etc.),
and some pick-up are effected (e.g. no rainbow at night). Also shaders of course should be affected, as well as background naturally.

**Webpage**
- Add icon (favicon)
- Suggest to make webpage installable (pwa) so that it can then work online (and add bigger icon for it, so that it then looks nice on the phone)
- Loading screen? Progress bar + splash Art - probably use gemini for inspiration too, but it should match our style more, not so pencil/comic art it does by default


## Other candidates

- Absurd hazards: e.g. kid throws a car at the pigeon → triggers scare-poop (no health;
  everything routes through the pressure meter).
- Pigeon skins (portrait + flight set per skin).
- Terrified portrait state for incoming hazards.
- Audio: coo, splat, honk.
