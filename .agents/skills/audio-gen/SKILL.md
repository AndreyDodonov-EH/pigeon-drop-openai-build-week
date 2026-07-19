---
name: audio-gen
description: Generate game audio (sound effects, music, ambience) via the ElevenLabs API using tools/audio.mjs. Use whenever a new sound or music track is needed, an existing generated sound needs a revision, or the user asks to "generate audio/sounds/music". Claude prompts, inspects spectrograms, and pre-selects; the user's ears are final acceptance.
---

# Generating game audio with ElevenLabs

API key lives in `.env` as `ELEVENLABS_API_KEY` (gitignored — never print it).
SDK: `@elevenlabs/elevenlabs-js`; ffmpeg via `ffmpeg-static` (both devDependencies).
Everything runs through `tools/audio.mjs`:

```
node tools/audio.mjs sfx <name> "<prompt>" [--dur s] [--loop] [--influence 0..1] [--variants n]
node tools/audio.mjs music <name> "<prompt>" [--len-ms ms] [--instrumental]
node tools/audio.mjs inspect <file...>
node tools/audio.mjs ship <master> <name> [--raw]
node tools/audio.mjs credits        # may be blocked by key permissions
```

## Pipeline

1. **Generate** with `--variants 2` for one-shots (variance is high; singles gamble).
   Masters land in `assets/audio-masters/<name>-v<i>.mp3` (committed, like art masters).
   Each generation auto-prints duration/levels and writes a `.spec.png`
   (spectrogram + waveform, gitignored).
2. **Inspect visually** — Read every `.spec.png`. You cannot hear; the picture is your
   ear. Reject: long silence gaps mid-file (dead air between events), multiple
   separate events when one was asked for, weak signal (max below ≈ −10 dB), missing
   low end on impacts, energy that clips the top band. `splat-v0` (triple event) and
   `splat-v1` (max −16 dB) are reference rejects.
3. **Ship the pick**: `ship <master> <name>` → `public/assets/audio/<name>.{ogg,mp3}`,
   auto-trims edge silence and normalizes peak to −1 dB (use `--raw` for loops/music
   where trimming could break the loop point). Delete any `.spec.png` that lands in
   `public/` — the build copies that dir wholesale.
4. **Log provenance** in `assets/AUDIO_LOG.md`: master chosen, why others rejected,
   exact prompt, shipped duration. Reuse logged prompts when extending a set.
5. **User audition** — always end by listing shipped files and remaining variants;
   the user's ears are acceptance, spectrograms are only pre-filter.

## Prompting

- House SFX style: `cartoon videogame [pickup/impact] sound: [event], comedic, short
  and snappy`. Game tone: raunchy/absurdist cartoon (see codex-image bible).
- Don't force `--dur` on one-shots — forced length gets padded with silence; let the
  model choose and trim at ship. Do use `--dur` + `--loop` for ambience loops.
- `--influence` ~0.7 when a retry keeps drifting off-prompt; default 0.3 gives variety.
- Music: `music <name> "<prompt>" --instrumental`, prompt = genre + mood + tempo +
  instrumentation + "game background music, loopable". Music burns far more credits
  than SFX — agree on direction with the user before generating, and generate ONE
  candidate, not variants.

## Wiring into Phaser

Load both formats (ogg first) and play:

```ts
this.load.audio("splat", ["assets/audio/splat.ogg", "assets/audio/splat.mp3"]);
this.sound.play("splat", { volume: 0.8 });
```

Shipped SFX are peak-normalized, so relative loudness is set at the call site via
`volume`, not baked into files. Every `play()` volume must be multiplied by the
matching bus master from `src/audio/mix.ts` (`SFX_VOLUME` / `MUSIC_VOLUME`) —
those two constants are the global loudness knobs. Verify triggers fire with the run-game skill (it
can't hear either, but confirms the code path).
