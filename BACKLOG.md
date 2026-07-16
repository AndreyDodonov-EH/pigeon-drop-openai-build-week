# Backlog

Future ideas and agreed-but-unbuilt work. Shipped features move to `CHANGELOG.md`.

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
- Procedural color variation for the same sprites (tint shifts to fake variety from the
  existing ped/car sets).

## Other candidates

- Absurd hazards: e.g. kid throws a car at the pigeon → triggers scare-poop (no health;
  everything routes through the pressure meter).
- Pigeon skins (portrait + flight set per skin).
- Terrified portrait state for incoming hazards.
- Audio: coo, splat, honk.
