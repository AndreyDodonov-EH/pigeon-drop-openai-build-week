# Backlog

Future ideas and agreed-but-unbuilt work. Shipped features move to `CHANGELOG.md`.

## Next up — first engagement slice (prioritized 2026-07-18, not started)

The engagement gap is **pull + juice, not more threats**: nothing lures the player off
the safe cruise line (optimal play is "hold the line and hold S"), and score chains have
no spectacle. The hydrant already covers the dodge verb; a second hazard adds threat
variety but no new decisions. Turbo is the biggest idea but lands best once food pickups
complete the meter economy (one resource: ammo + boost + comedy). Ordered by
payoff-per-effort:

1. **Combo ranks** (zero assets, pure code): uncap the x8 combo counter in `onSplat()`;
   keep the score multiplier plateauing at x8 behind the scenes. Rank thresholds on
   combo count (e.g. 3/6/10/15) show Splat! → Dirty! → Craptacular! → SHITSTORM in the
   HUD with escalating style (size/color, scale-punch on rank-up, small shake at
   SHITSTORM). Scare-poop already zeroes the combo — wiping a high rank makes the
   hydrant retroactively matter.
2. **Food pickups** (bread crust / fries / kebab): extend `PickupKind`; separate,
   more-frequent food spawn timer (~5–9s vs rainbow's 12–20s); place at awkward
   altitudes — near the ground clamp, near the ceiling, occasionally in the hydrant
   approach lane. Meter jumps roughly +15/+25/+40 — the kebab can shove you toward
   blowout (reward with teeth). Add a `spawnFoodPickup` debug hook to `window.SP`.
3. **Skater** (high-value fast target, skill ceiling for aiming): ped variant 3 with own
   vx ~2.5–3.5 (vs 0.3–0.8 walkers), either direction, base score 40; extend
   `PED_LINES` / `PED_LINES_RAINBOW`; verify `VictimPalettePipeline` variant packing
   handles a 4th ped.
- Freebie alongside: randomize the hydrant burst trigger distance
  (`pigeon.x + 230` → `+ 200 + rand()*80`, rolled at spawn).

**Assets needed, in order:** none for ranks; then a food-pickup sheet
(`pickup-bread/fries/kebab`, sized like `pickup-rainbow` at `PICKUP_SCALE`) and a skater
sheet (`ped-3` / `ped-3-r` / `ped-3-rainbow`, matching the pedestrian sheet layout) —
both via the codex-image → `ART_LOG.md` pipeline. Deferred to later slices: turbo pigeon
set, open-beak blowout frame, terrified portrait, audio.

## Meter economy — remaining work (agreed 2026-07-14; core shipped, see CHANGELOG)

- **Food pickups** for big meter jumps (bread crusts, fries, kebab; place at varying
  altitude to lure the player off the safe line).
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
- Burst trigger is now deterministic (pigeon.x + 230) — consider randomizing the trigger
  distance a little if the dodge starts feeling too predictable.

## Idea dump (user, 2026-07-17)

**Targets & scoring**
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

**Pickups**
- Pickups as food that changes the goo (`PickupKind` pattern is ready): coffee, chilli,
  rainbow — each with its own behavioral twist (e.g. coffee = rapid-fire drip, chilli =
  explosive/burning splat).

**World & level design**
- Higher platforms / screen layers — e.g. flying at balcony level, vertical screen
  transgressions beyond the single street lane.
- Occasional events, e.g. a Politiker motorcade (or different levels/themes entirely).
- Window washer (mid-air platform/victim on a suspended cradle).
- Drones (airborne hazard or target at flight altitude).

**Visuals**
- Slightly decrease model size? (another pass — sprites were rebalanced 2026-07-17,
  see CHANGELOG).

## Other candidates

- Absurd hazards: e.g. kid throws a car at the pigeon → triggers scare-poop (no health;
  everything routes through the pressure meter).
- Pigeon skins (portrait + flight set per skin).
- Terrified portrait state for incoming hazards.
- Audio: coo, splat, honk.
