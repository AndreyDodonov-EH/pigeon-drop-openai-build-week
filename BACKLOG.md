# Backlog

## Meter inversion — pressure economy (agreed 2026-07-14, CORE SHIPPED 2026-07-14)

Shipped: digestion-pressure economy (passive fill 0.12/frame, poop drains), auto-blowout
at 100% with telegraph (wobbly flight from meter ≥ 92 + panic portrait; no sound yet),
scare-poop replacing damage entirely (D key debugs it — wire to real hazards later),
portrait as a pure prioritized state function with min-hold (battered → panic → strain →
pleased → normal; flicker fixed), and the gauge reimagined as a ring around the portrait
(cream → amber ≥ 70% → pulsing red ≥ 88%). New `portrait-panic` art logged in ART_LOG.

Still to do from the agreed design:
- **Food pickups** for big meter jumps (bread crusts, fries, kebab; place at varying
  altitude to lure the player off the safe line).
- **Open-beak flight sprite** for the telegraph (portrait + wobble only for now) + sound.
- Ties into turbo (below): turbo spends meter as rocket fuel — one resource governs
  ammo, boost, and comedy.

## Turbo / rocket guano (noted 2026-07-13, user idea)
Guano as explicit accelerator: holding the poop stream propels the pigeon like a rocket
(thrust opposite the stream), with turbo particle effects (exhaust flames/steam mixed
into the goo emission) and a **dedicated turbo pigeon sprite variant** (strained body,
swept-back wings, motion-blur feathers). Design the sprite set so pose variants like
this slot in alongside the normal flight frames.

## Goo conforming to sprites — alpha-mask dripping (SHIPPED 2026-07-14)
Implemented as designed: `src/goo/alphaMask.ts` extracts per-texture alpha silhouettes;
GooSim resolves stick/slide/detach against the mask (AABB stays broadphase, widened to
full sprite); GameScene syncs each collider's mask to the displayed frame, so reaction
frames shake hanging goo loose for free. Slow contacts perch on the silhouette instead
of AABB push-out.

## Altitude-hold flight model (SHIPPED 2026-07-15)
Velocity trims toward an input-chosen target (climb −3.6 / hover 0 / dive +4.2 px/frame,
9%/frame approach): hands-off, the pigeon levels out and HOLDS its line (plus a visual-only
hover bob). DOWN arrow repurposed from redundant poop key to dive. Default cruise altitude
raised to y=150 (`START_Y`). Verified by `scripts/flight-shot.mjs`.

## Fire hydrant hazard (SHIPPED 2026-07-15)
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
you react to the warn telegraph. Possible follow-ups: peds reacting to the water, hydrant
splash puddle, sound, terrified portrait cue during warn.

**Water jet visual upgrade (2026-07-15):** replaced the code-only `fillRect` band loop with
a `water-col` sprite (seamless tileable texture, `assets/ART_LOG.md`) rendered as a
`TileSprite` — height driven by `jetH` every frame, `tilePositionY` scrolled continuously
for flow, so the shaft actually reads as moving water instead of static ribbed rectangles.
Topped with a `water-crown` splash sprite that scales in/out with the burst. Warn-state
sputter drops stayed as cheap procedural graphics circles.

## Other candidates
- Absurd hazards: e.g. kid throws a car at the pigeon → triggers scare-poop (see meter
  inversion above; no health).
- Pickups: rainbow-boost (already supported by the sim via per-particle tint) — food
  pickups themselves are part of meter inversion above.
- Pigeon skins (portrait + flight set per skin).
- Terrified portrait state for incoming hazards.
- Audio: coo, splat, honk.
