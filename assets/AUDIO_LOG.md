# Generated audio provenance log

## public/assets/audio/music-sneaky.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/music-sneaky.mp3` (60.03 s, shipped `--raw`)
- **Role:** base gameplay loop; plays in lockstep with music-klezmer, combo < 4
  (see `src/audio/MusicManager.ts` — regenerations MUST keep 120 BPM / D minor / 60 s
  or the synced crossfade breaks)
- **Prompt:** `sneaky pizzicato cartoon game background music, seamless loop: light bouncy plucked strings playing an evenly-paced tiptoeing melody, bassoon and muted trumpet comedy accents, mischievous stealthy mood like a cartoon villain sneaking, steady even pulse at exactly 120 BPM, D minor, constant energy throughout, no intro, no outro, no ending` (`--instrumental --len-ms 60000`)

## public/assets/audio/music-klezmer.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/music-klezmer.mp3` (60.08 s, shipped `--raw`)
- **Role:** frantic tier, combo ≥ 4; same grid as music-sneaky (tempo match verified
  by onset autocorrelation — both lock to a ~1 s period, i.e. 120 BPM)
- **Prompt:** `frantic joyful klezmer cartoon game background music, seamless loop: wailing clarinet lead melody, accordion, brass section, driving drums, festive chaotic street-party mayhem, high energy celebration, exactly 120 BPM, D minor, constant energy throughout, no intro, no outro, no ending` (`--instrumental --len-ms 60000`)

Reuse these exact prompts when regenerating or extending a set — consistency depends
on it. All generated with `tools/audio.mjs` (ElevenLabs text-to-SFX; key in `.env`).

House prompt style for SFX: *"cartoon videogame [pickup/impact] sound: [event],
comedic, short and snappy"*. Don't force `--dur` for one-shots — the model picks a
natural length and `ship` trims silence + normalizes peak to −1 dB.

## public/assets/audio/splat.{ogg,mp3} — pedestrian — 2026-07-18

- **Master:** `assets/audio-masters/splat-v3.mp3` (user-supplied replacement; original
  ElevenLabs prompt was not recorded in the repository)
- **Edit:** isolated the strongest, fuller third impact at 2.72–3.08 s, added a 4 ms
  entrance fade and 60 ms exit fade, then ran the standard silence trim, mono fold-down,
  and peak normalization. The complete 5.04 s source master remains untouched.
- **Shipped:** 0.17 s after trim. Replaces v2 (v0 was a triple-splat take; v1 was too weak).

## public/assets/audio/splat-car.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/splat-car-v0.mp3` (v1 rejected: several extra ringing
  impulses made one hit sound repeated)
- **Prompt:** `cartoon videogame impact sound: one single wet pigeon dropping splats onto
  a hollow metal car roof, a juicy slap with a short rounded metal bonnet thunk, comedic,
  short and snappy, one impact only, no repeats, no long tail, no silence`
- **Edit:** retained 0–0.50 s and faded the final 80 ms before the standard trim,
  normalization, mono fold-down, and dual-format encode.
- **Shipped:** 0.45 s

## public/assets/audio/splat-asphalt.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/splat-asphalt-v1.mp3` (v0 rejected: fragmented into
  multiple small clicks instead of one flat landing)
- **Prompt:** `cartoon videogame impact sound: one single wet pigeon dropping splats onto
  hard city asphalt, a flat juicy slap with a tiny gritty pavement texture, comedic, short
  and snappy, one impact only, no repeats, no long tail, no silence`
- **Edit:** retained 0–0.28 s and faded the final 80 ms before the standard trim,
  normalization, mono fold-down, and dual-format encode.
- **Shipped:** 0.22 s

## public/assets/audio/gas-whoosh.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/gas-whoosh-v1.mp3` (v0 rejected: two seconds of
  diffuse air noise was too long for a recurring stream cue)
- **Prompt:** `cartoon videogame gas-mode sound: one short comical wet puke-heave that
  blossoms into a soft farting whoosh of toxic green gas, silly rather than gross, short
  and snappy, one burst only, no repeats, no long silence`
- **Shipped:** 1.00 s after standard trim, mono fold-down, and peak normalization.
  Runtime plays it once per press at natural rate (±5% random detune) as the opening
  heave, with the `gas-loop` bed sustaining underneath; it never restarts mid-hold, and
  a re-press while the last heave still rings joins the bed without stacking another.
  (Earlier rate-0.3 slowdown hack retired: it pitched the heave down ~1.7 octaves and
  still went silent after ~3.4 s of an 8 s gas window.)

## public/assets/audio/gas-loop.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/gas-loop-v1.mp3` (v0 rejected: plain broadband air
  hiss, indistinguishable from the hydrant water bed; v1 carries tonal bubbly banding)
- **Prompt:** `cartoon videogame ambience loop: continuous comical stream of toxic green
  gas sputtering and hissing from a bird's rear, soft bubbly farting undertone with a
  steady airy hiss, silly rather than gross, even texture, no distinct events, no rhythm,
  seamless loop` (`--dur 3 --loop`)
- **Shipped:** 3.00 s raw to preserve the loop point. Loops under the whole gas stream
  after the gas-whoosh heave opener: 130 ms fade-in on stream start, 200 ms fade-out on
  release, meter empty, or gas-timer expiry.

## public/assets/audio/hydrant-burst.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/hydrant-burst-v0.mp3` (v1 rejected: contained several
  separated bursts rather than one cap-pop event)
- **Prompt:** `cartoon videogame hazard sound: one fire hydrant cap popping open followed
  by a powerful upward water whoosh and brief spray, comedic, short and snappy, one burst
  only, no repeats, no long silence`
- **Shipped:** 1.00 s after standard trim, mono fold-down, and peak normalization.
  Retained for audition/provenance but superseded in runtime by the gentler clank + jet bed.

## public/assets/audio/hydrant-clank.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/hydrant-clank-v0.mp3` (v1 rejected: fourteen seconds
  of repeated weak rattling rather than a compact telegraph)
- **Prompt:** `cartoon videogame warning sound: a loose metal fire hydrant lid gently
  rattles with two or three soft muted clinks, light restrained cap wobble, subtle and
  anticipatory, no harsh clang, no explosion, no water, short and snappy`
- **Shipped:** 0.30 s after standard trim, mono fold-down, and peak normalization. Plays
  once when the hydrant enters its warning state.

## public/assets/audio/hydrant-jet-loop.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/hydrant-jet-loop-v0.mp3` (user preferred its fuller,
  steadier water bed over v1; runtime gain reduced from 0.28 to 0.18)
- **Prompt:** `cartoon videogame ambience loop: continuous high-pressure water jet
  erupting from an open fire hydrant, lush rushing water spray, steady watery hiss with
  slight natural turbulence, no cap pop, no impacts, no rhythm, seamless loop`
  (`--dur 3 --loop`)
- **Shipped:** 3.00 s raw to preserve the loop point. Plays alone while the water column
  is active, after the separate lid-clank telegraph.

## public/assets/audio/splash-hydrant.{ogg,mp3} — 2026-07-19

- **Master:** `assets/audio-masters/splash-hydrant-v1.mp3` (v0 rejected: 28 s of ~15
  separate splash events instead of one hit)
- **Prompt:** `cartoon videogame impact sound: a bird crashing into a vertical fire
  hydrant water jet, one big juicy comedic sploosh with a watery kick, short and snappy,
  one splash only, no repeats, no long tail, no silence`
- **Shipped:** 2.00 s after standard trim, mono fold-down, and peak normalization.
  Plays once when the pigeon flies into the hydrant water column, paired with
  `koo-irritated` 220 ms later.

## public/assets/audio/koo-irritated.{ogg,mp3} — 2026-07-19

- **Master:** `assets/audio-masters/koo-irritated-v0.mp3` (v1 rejected: three separate
  coo phrases over 3 s, multi-event)
- **Prompt:** `cartoon videogame character voice: one short irritated pigeon coo, a
  grumpy annoyed "koo!" squawk-coo from a cartoon pigeon, indignant and comedic, short
  and snappy, one coo only, no repeats, no long tail, no silence`
- **Shipped:** 1.00 s after standard trim, mono fold-down, and peak normalization.
  Delayed 220 ms after the hydrant-jet splash so it reads as the pigeon's reaction.

## public/assets/audio/pickup-pea.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/pickup-pea-v1.mp3` (v0 rejected: ~1 s dead air between pop and munch)
- **Prompt:** `cartoon videogame pickup sound: a bright juicy pop of a pea pod being snatched, followed by a quick squishy comedic munch, short and snappy`
- **Shipped:** 1.00 s

## public/assets/audio/pickup-chilli.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/pickup-chilli-v0.mp3` (punchier attack than v1)
- **Prompt:** `cartoon videogame pickup sound: a short fiery sizzle-hiss with a comedic whoosh of flame igniting, spicy hot pepper energy, short and snappy`
- **Shipped:** 1.68 s

## public/assets/audio/pickup-coffee.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/pickup-coffee-v0.mp3` (v1 rejected: double event with gap)
- **Prompt:** `cartoon videogame pickup sound: a quick comedic coffee slurp and satisfied gulp followed by a perky energetic sparkle, caffeinated excitement, short and snappy`
- **Shipped:** 1.00 s
