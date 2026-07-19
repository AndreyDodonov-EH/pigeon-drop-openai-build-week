# Backlog

Future ideas and agreed-but-unbuilt work. Shipped features move to `CHANGELOG.md`.

## Fire hydrant follow-ups

- Peds reacting to the water; hydrant splash puddle; sound; terrified portrait cue
  during warn.

## Idea dump (user, 2026-07-17)

**Targets & scoring**
- Stationary Objects to dump on, e.g. statues (static targets — presumably score less than moving
  victims, or hold a persistent goo coat).
- Higher-altitude targets: rooftop party.
- Chain reactions to create chaos? (one splat triggers the next — startled ped stumbles
  into a car, honk scares more peds…)
- **Character interactions:** matching or compatible pedestrians occasionally pause when
  they meet and play a short paired gag before continuing. Examples: two gym bros stop to
  out-flex each other; two granddads lean on their canes and gossip. Also use sound for the gossip. Use proximity plus a
  per-character cooldown so interactions stay surprising and do not jam pedestrian flow.

**Pooping**
- combine pooping (e.g. gas (pea pod) + rainbow = rainbow gas!) Make sure to keep the code ouf of GameScene file not too grow it even further - it's separate logic

**Sounds**
- Sound for character interation (once done)


- Slighly crackling sound when we poo in chilli mode

**Pickups**
- Add sound to pick-ups (some are already present in the repository, just not wired)
- Kebab/bread can effect how liquid goo is - kebab should make it more liquid, bread - a little denser. May be with timer, but no explicit one. It just should feel naturally as part of the game, more    diegetic.

**World & level design**
- Day mechanic - this demo is day one, with different time of day (see other point) - at the end pigeon goes happily to sleep - flies away and goes to sleep on the roof. 
  Then full-screen cozy art of pigeon going to sleep and text "see you in the morning!" or "see you next day!"
- **Combo-rank world reactions** (user, 2026-07-19): convey the "heating up" phases
  through world behavior instead of screen effects (a mood vignette was tried and cut —
  read as a filter, see CHANGELOG). Escalating with rank tier: pedestrians become more
  nervous/twitchy, cars start maneuvering/swerving, and at the top end even the sun/moon
  looks at you in awe/fear. Needs more sprites/animation states; rank tier is already
  available via `rankForCombo` in `src/ui/ranks.ts`.
- Natural habitat points - e.g. extra building "gym" plus then a lot of bodybuilders near it
- stationary victims, e.g. people sitting in from of the caffe (caffe building exists already)
- Higher platforms / screen layers — e.g. flying at balcony level, vertical screen
  transgressions beyond the single street lane.
- Occasional events, e.g. a Politiker motorcade (or different levels/themes entirely).
- Window washer (mid-air platform/victim on a suspended cradle).
- Drones (airborne hazard or target at flight altitude).
- Night-specific characters for the day/night cycle (the cycle itself shipped 2026-07-19,
  see CHANGELOG): e.g. stationary hooker near a lamp at midnight, robber, etc. New spawns
  can key off `DayNight` (`src/world/DayNight.ts` — `isNight` / `nightness`), same as the
  no-rainbow-at-night pickup rule already does. Car headlights at night would also sell it.

**Webpage**
- Add icon (favicon)
- Suggest to make webpage installable (pwa) so that it can then work online (and add bigger icon for it, so that it then looks nice on the phone)
- Loading screen? Progress bar + splash Art - probably use gemini for inspiration too, but it should match our style more, not so pencil/comic art it does by default


## Other candidates

- Pigeon skins (portrait + flight set per skin).
- Terrified portrait state for incoming hazards.
