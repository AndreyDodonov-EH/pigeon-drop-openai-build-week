# Generated audio provenance log

Reuse these exact prompts when regenerating or extending a set — consistency depends
on it. All generated with `tools/audio.mjs` (ElevenLabs text-to-SFX; key in `.env`).

House prompt style for SFX: *"cartoon videogame [pickup/impact] sound: [event],
comedic, short and snappy"*. Don't force `--dur` for one-shots — the model picks a
natural length and `ship` trims silence + normalizes peak to −1 dB.

## public/assets/audio/splat.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/splat-v2.mp3` (chosen over v0: triple-splat take; v1: too weak)
- **Prompt:** `single short cartoon wet splat on concrete` (`--dur 1.5`)
- **Shipped:** 0.30 s after trim

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
