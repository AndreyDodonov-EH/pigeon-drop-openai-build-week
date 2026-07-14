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

## Other candidates
- Absurd hazards: e.g. kid throws a car at the pigeon → triggers scare-poop (see meter
  inversion above; no health).
- Pickups: rainbow-boost (already supported by the sim via per-particle tint) — food
  pickups themselves are part of meter inversion above.
- Pigeon skins (portrait + flight set per skin).
- Terrified portrait state for incoming hazards.
- Audio: coo, splat, honk.
