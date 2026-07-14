# Backlog

## Meter inversion — pressure economy (agreed 2026-07-14, DO NEXT SESSION)

Replace the ammo-style meter (drain on poop, passive regen) with digestion pressure;
no health/HP anywhere. Decisions already made with the user — don't re-litigate:

- **Fill:** slow passive digestion tick + food pickups for big jumps (bread crusts,
  fries, kebab; place at varying altitude to lure the player off the safe line).
- **Full meter = auto-blowout:** at 100% the pigeon involuntarily dumps everything in
  one huge uncontrolled blast, usually wasted, combo-neutral at best. The approach MUST
  be clearly telegraphed before it fires: wobbly flight, open-beak pigeon sprite,
  and sound. (User called the indication "important".)
- **Hazard hit = scare-poop:** replaces damage/health entirely — involuntary full dump,
  combo reset, battered portrait. Punishment is wasted pressure, never survival.
- **Portrait becomes a pure function of state** (fixes flicker: pleasedTimer currently
  fights pooping frame-by-frame): strict priority battered → panic/blowout → strain
  (pooping OR meter > ~85%) → pleased (just relieved) → normal, with a minimum hold
  time per state. Strain-at-high-meter doubles as the urgency warning.
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
