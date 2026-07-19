# Generated audio provenance log

## public/assets/audio/music-sneaky.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/music-sneaky.mp3` (60.03 s, shipped `--raw`)
- **Role:** base gameplay loop; plays in lockstep with all layers at every combo phase.
  It plays alone at combo 0–1; at combo 2–3 a second instance of this same file joins,
  offset by an eighth note, so the interleaved plucks double the perceived tempo ("two
  pizzicatos"); both stay beneath the klezmer topper at combo ≥ 4
  (see `src/audio/MusicManager.ts` — regenerations MUST keep 120 BPM / D minor / 60 s
  or the synchronized layered arrangement breaks)
- **Prompt:** `sneaky pizzicato cartoon game background music, seamless loop: light bouncy plucked strings playing an evenly-paced tiptoeing melody, bassoon and muted trumpet comedy accents, mischievous stealthy mood like a cartoon villain sneaking, steady even pulse at exactly 120 BPM, D minor, constant energy throughout, no intro, no outro, no ending` (`--instrumental --len-ms 60000`)

## public/assets/audio/music-klezmer.{ogg,mp3} — 2026-07-18

- **Master:** `assets/audio-masters/music-klezmer.mp3` (60.08 s, shipped `--raw`)
- **Role:** high-combo topper; silent below combo 4, then swells with the combo level
  (0.40 at x4 up to 0.58 at the x8 cap) over the two pizzicato layers. When the combo
  breaks it holds for two bars before its long release instead of fading immediately.
  Same grid as music-sneaky (tempo match verified by onset autocorrelation — both lock
  to a ~1 s period, i.e. 120 BPM). Its measured average is 3.6 dB louder, so runtime mix
  targets compensate and retain headroom (`src/audio/MusicManager.ts`).
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

## public/assets/audio/belly-rumble.{ogg,mp3} — 2026-07-19

- **Master:** `assets/audio-masters/belly-rumble2-v0.mp3` (belly-rumble-v0 rejected:
  broadband click at t=0; belly-rumble-v1 rejected: two grumble phrases with a mid-file
  gap; belly-rumble2-v1 usable but denser/less expressive — kept as spare)
- **Prompt:** `cartoon videogame sound: single short hungry stomach growl, deep empty
  belly gurgle, comedic, one continuous rumble, short and snappy`
- **Shipped:** 1.72 s. Plays when poop is held on an empty/locked tank (the empty-tank
  telegraph, cooldown 130 frames so it never overlaps itself) — replaced the earlier
  "grumble…" text popup and pitched-up koo-irritated placeholder same day.

## ~~public/assets/audio/ped-grumble.{ogg,mp3}~~ — 2026-07-19, superseded same day

Superseded by the per-character set below (user: one generic voice fit only the
granddad); file removed from `public/`, master retained — it *became* `ped-grumble-2`.

- **Master:** `assets/audio-masters/ped-grumble-v1.mp3` (v0 rejected: flat static
  harmonic tone, reads as a horn drone rather than a voice)
- **Prompt:** `cartoon videogame character voice: one short indignant grumpy exclamation
  from a cartoon city pedestrian just splatted from above, an outraged angry
  'hey!'-style gibberish yelp, comedic, short and snappy, one exclamation only, no
  repeats, no long tail, no silence`
- **Shipped:** 2.00 s. Irritated ped hit reaction; gated by `VOCAL_PED_VARIANTS`
  (0/2/5), 55% chance, shared 2.5 s voice cooldown; plays 150 ms after the splat at
  0.55 × SFX bus, ±8% rate. Replaces that hit's text line when it fires.

## ~~public/assets/audio/ped-delight.{ogg,mp3}~~ — 2026-07-19, superseded same day

Superseded by the per-character set below; file removed from `public/`, master retained
as an audition spare (its woo-hoo was replaced by a shorter bro-specific whoop).

- **Master:** `assets/audio-masters/ped-delight-v1.mp3` (v0 rejected: 0.5 s pluck-like
  tonal chirp with flat harmonics, not a vocal cheer)
- **Prompt:** `cartoon videogame character voice: one short delighted joyful exclamation
  from a cartoon city pedestrian, a gleeful surprised 'woo-hoo!'-style happy cheer,
  comedic, short and snappy, one exclamation only, no repeats, no long tail, no silence`
- **Shipped:** 2.00 s. Rainbow-hit ped reaction, same gating as ped-grumble; louder
  master (mean −7.7 dB) so it runs at 0.40 × SFX bus.

## public/assets/audio/car-honk-angry.{ogg,mp3} — 2026-07-19

- **Master:** `assets/audio-masters/car-honk-angry-v1.mp3` (v0 rejected: single flat
  blast, prompt asked for a double honk)
- **Prompt:** `cartoon videogame car sound: one short angry car horn double-honk,
  irritated aggressive beep-beep from a cartoon city car, comedic, short and snappy, one
  double honk only, no repeats, no long tail, no silence`
- **Shipped:** 1.00 s beep-BEEP. Irritated car hit reaction; gated by
  `VOCAL_CAR_VARIANTS` (0/1 — the van keeps its text line), same chance/cooldown as ped
  voices; 0.45 × SFX bus.

## public/assets/audio/car-honk-happy.{ogg,mp3} — 2026-07-19

- **Master:** `assets/audio-masters/car-honk-happy-v1.mp3` (v0 rejected: one flat
  sustained honk, no melody)
- **Prompt:** `cartoon videogame car sound: one short cheerful melodic car horn toot, a
  friendly happy fanfare-like honk from a cartoon city car, comedic, short and snappy,
  one honk phrase only, no repeats, no long tail, no silence`
- **Shipped:** 1.00 s four-note honk phrase. Rainbow-hit car reaction, same gating;
  0.42 × SFX bus.

## public/assets/audio/ped-{grumble,delight}-{0,2,5}.{ogg,mp3} — per-character voices — 2026-07-19

Replaces the generic `ped-grumble`/`ped-delight` pair (user: voices must match their
character and be short enough that the shouting ped is still on screen). One
grumble + one delight per vocal variant, all cut to ≤1.3 s (edits: ffmpeg `-t` cut with
an 80 ms exit fade into a scratch intermediate, then the standard ship trim/normalize).
Runtime volumes dropped a notch below the old pair and vary per file to even out master
loudness (`PED_GRUMBLE_VOLUME` / `PED_DELIGHT_VOLUME` in GameScene) — street-level
voices are distant.

- **ped-grumble-0** (suit guy, 0.59 s) — master `ped-grumble-0-v0.mp3`, first yelp only
  (cut at 0.65 s; the take is two identical yelps split by a second of silence; v1
  rejected: 2 s continuous mutter, too long). Prompt: `cartoon videogame character
  voice: one very short prissy indignant huff from a snooty uptight businessman splatted
  from above, a clipped nasal outraged 'hey!'-style yelp, comedic, under one second, one
  exclamation only, no repeats, no long tail, no silence`
- **ped-grumble-2** (granddad, 1.00 s) — master `ped-grumble-v1.mp3` (the original
  generic grumble the user liked for the old man), cut at 1.0 s to its first two
  phrases.
- **ped-grumble-5** (gym bro, 1.00 s) — master `ped-grumble-5-v0.mp3` shipped uncut
  (deeper low end than v1). Prompt: `…one very short annoyed deep grunt from a
  musclebound gym bro, a low irritated dudebro 'bro!'-style bark…`
- **ped-delight-0** (suit guy, 1.30 s) — master `ped-delight-0-v1.mp3`, tail cut at
  1.3 s (v0 rejected: flat-harmonic synthy chirp, not vocal). Prompt: `…one very short
  posh delighted gasp from a snooty uptight businessman, a refined pleasantly-surprised
  'oooh!' of joy…` *(superseded same day — user: too robotic; see revision below)*
- **ped-delight-2** (granddad, 1.03 s) — master `ped-delight-2-v0.mp3`, cut at 1.05 s
  (~4 hee-hees of an even cackle; v1 kept as gappier spare). Prompt: `…one very short
  wheezy delighted cackle from a creaky old grandpa, a raspy gleeful 'hee-hee!'
  chuckle…`
- **ped-delight-5** (gym bro, 0.55 s) — master `ped-delight-5-v0.mp3`, first "yeah!"
  swell (cut at 0.78 s; v1 rejected outright: 12 s of crowd noise). Prompt: `…one very
  short stoked deep cheer from a musclebound gym bro, a pumped enthusiastic
  'yeah!'-style whoop…` *(superseded same day — user: strange; see revision below)*

## Ped voice revision + influencer pair — 2026-07-19

User audition on the per-character set: delight-0 too robotic, delight-5 strange —
both regenerated with prompts that add `natural human voice actor / organic and
expressive, not synthesized`. Also added a voice pair for the influencer (ped variant
3, "NOT THE BAG!" / "CONTENT GOLD!"), now in `VOCAL_PED_VARIANTS`.

- **ped-delight-0** replacement (suit guy, 0.99 s) — master `ped-delight-0b-v0.mp3`,
  cut at 1.05 s (0b-v1 rejected: max −12.1 dB, far too weak). Prompt: `cartoon
  videogame character voice: one very short posh delighted gasp of joy from a snooty
  uptight businessman, a natural warm human male voice actor exclaiming a refined
  pleasantly-surprised 'ooh!', organic and expressive, not synthesized, comedic, under
  one second, one exclamation only, no repeats, no long tail, no silence`
- **ped-delight-5** replacement (gym bro, 1.00 s) — master `ped-delight-5b-v1.mp3`
  shipped uncut, one solid shout (5b-v0 rejected: 2 s two-part "woo…yeah" phrase, too
  long). Prompt: `…one very short pumped celebratory shout from a musclebound gym bro,
  a natural deep human male voice yelling an excited 'woo yeah!' cheer, organic and
  expressive, not synthesized…`
- **ped-grumble-3** (influencer, 0.69 s) — master `ped-grumble-3-v1.mp3`, second phrase
  isolated (atrim 0.98–1.85 s: rising whiny "ughhh" into a breathy scoff; its first
  event is a plainer "ugh" spare; v0 rejected: max −5.8 dB weak, long dead air).
  Prompt: `…one very short outraged offended scoff from a vain social-media influencer
  young woman, a natural human female voice actor exclaiming a shocked whiny
  'ugh!'-style complaint, organic and expressive…`
- **ped-delight-3** (influencer, 1.00 s) — master `ped-delight-3-v0.mp3` shipped uncut,
  one compact squeal with a pitch arc (v1 rejected: 6 s multi-event with claps).
  Prompt: `…one very short thrilled squeal of joy from a vain social-media influencer
  young woman, a natural human female voice actor exclaiming an excited 'omg!'-style
  delighted squeal, organic and expressive…`

Pipeline note for future cuts: when isolating a segment, do the cut with
`atrim=<a>:<b>,asetpts=PTS-STARTPTS,afade=…` in one `-af` chain — combining output-side
`-ss` with `afade` runs the fades on the *input* timeline (a fade-out placed before the
seek point silences the whole kept region, and `ship`'s silence trim then deletes
everything; this bit once).

## ped-delight-5 revision 2 — 2026-07-19

User audition: the 5b-v1 whoop read as a karate kiai, not a gym bro. Regenerated with
the shout steered away (`low easygoing 'yeeeah brooo!' flex cheer, relaxed and cocky,
not a sharp shout, no karate kiai, no scream`).

- **ped-delight-5** replacement (gym bro, 1.45 s) — master `ped-delight-5c-v1.mp3`,
  cut at 1.45 s with a 100 ms exit fade (its full tail ran 2 s). Chosen for the wavy
  speech-like "yeeeah brooo" pitch contour and soft swell onset; `5c-v0` (1.04 s
  gravelly growl, snappier but less phrase-like) kept as first spare. Runtime volume
  unchanged at 0.23 (shipped mean −9.7 dB ≈ previous −10.2).
