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
