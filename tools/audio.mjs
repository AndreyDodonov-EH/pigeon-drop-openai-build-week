#!/usr/bin/env node
// Audio generation pipeline: ElevenLabs → assets/audio-masters/ → public/assets/audio/
//
//   node tools/audio.mjs sfx <name> "<prompt>" [--dur <sec>] [--loop] [--influence <0..1>] [--variants <n>]
//   node tools/audio.mjs music <name> "<prompt>" [--len-ms <ms>] [--instrumental]
//   node tools/audio.mjs inspect <file...>          # spectrogram+waveform png, duration, levels
//   node tools/audio.mjs ship <master> <name>       # encode chosen master → public/assets/audio/<name>.{ogg,mp3}
//   node tools/audio.mjs credits                    # remaining ElevenLabs credits

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const ROOT = path.resolve(import.meta.dirname, "..");
const MASTERS = path.join(ROOT, "assets", "audio-masters");
const SHIP = path.join(ROOT, "public", "assets", "audio");

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const env = readFileSync(path.join(ROOT, ".env"), "utf8");
  const m = env.match(/^ELEVENLABS_API_KEY=(.+)$/m);
  if (!m) throw new Error("ELEVENLABS_API_KEY not found in env or .env");
  return m[1].trim();
}

const flags = {};
const positional = [];
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith("--")) {
    const key = a.slice(2);
    const next = process.argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) { flags[key] = next; i++; }
    else flags[key] = true;
  } else positional.push(a);
}
const [cmd, ...args] = positional;

async function streamToFile(streamPromise, file) {
  const stream = await streamPromise;
  const buf = Buffer.from(await new Response(stream).arrayBuffer());
  writeFileSync(file, buf);
  return buf.length;
}

function inspectVerbose(file) {
  const png = file.replace(/\.[a-z0-9]+$/i, "") + ".spec.png";
  execFileSync(ffmpeg, [
    "-y", "-i", file,
    "-filter_complex",
    "[0:a]showspectrumpic=s=1024x384:legend=0[s];[0:a]showwavespic=s=1024x128:colors=white[w];[s][w]vstack",
    "-frames:v", "1", png,
  ], { stdio: "pipe" });
  // volumedetect and Duration land on stderr even on success
  const res = spawnCapture(["-i", file, "-af", "volumedetect", "-f", "null", "-"]);
  const dur = res.match(/Duration: (\d+:\d+:[\d.]+)/)?.[1] ?? "?";
  const mean = res.match(/mean_volume: ([-\d.]+ dB)/)?.[1] ?? "?";
  const max = res.match(/max_volume: ([-\d.]+ dB)/)?.[1] ?? "?";
  console.log(`${path.relative(ROOT, file)}  dur=${dur}  mean=${mean}  max=${max}`);
  console.log(`  spectrogram: ${path.relative(ROOT, png)}`);
}

function spawnCapture(ffArgs) {
  const res = spawnSync(ffmpeg, ffArgs, { encoding: "utf8" });
  return res.stderr ?? "";
}

async function main() {
  const client = () => new ElevenLabsClient({ apiKey: apiKey() });

  if (cmd === "sfx") {
    const [name, prompt] = args;
    if (!name || !prompt) throw new Error("usage: sfx <name> \"<prompt>\" [--dur s] [--loop] [--influence x] [--variants n]");
    mkdirSync(MASTERS, { recursive: true });
    const variants = Number(flags.variants ?? 1);
    for (let v = 0; v < variants; v++) {
      const file = path.join(MASTERS, variants > 1 ? `${name}-v${v}.mp3` : `${name}.mp3`);
      const bytes = await streamToFile(client().textToSoundEffects.convert({
        text: prompt,
        ...(flags.dur ? { durationSeconds: Number(flags.dur) } : {}),
        ...(flags.loop ? { loop: true } : {}),
        ...(flags.influence ? { promptInfluence: Number(flags.influence) } : {}),
      }), file);
      console.log(`wrote ${path.relative(ROOT, file)} (${bytes} bytes)`);
      inspectVerbose(file);
    }
  } else if (cmd === "music") {
    const [name, prompt] = args;
    if (!name || !prompt) throw new Error("usage: music <name> \"<prompt>\" [--len-ms ms] [--instrumental]");
    mkdirSync(MASTERS, { recursive: true });
    const file = path.join(MASTERS, `${name}.mp3`);
    const bytes = await streamToFile(client().music.compose({
      prompt,
      ...(flags["len-ms"] ? { musicLengthMs: Number(flags["len-ms"]) } : {}),
      ...(flags.instrumental ? { forceInstrumental: true } : {}),
    }), file);
    console.log(`wrote ${path.relative(ROOT, file)} (${bytes} bytes)`);
    inspectVerbose(file);
  } else if (cmd === "inspect") {
    for (const f of args) inspectVerbose(path.resolve(f));
  } else if (cmd === "ship") {
    const [master, name] = args;
    if (!master || !name) throw new Error("usage: ship <master> <name>");
    mkdirSync(SHIP, { recursive: true });
    const src = path.resolve(master);
    if (!existsSync(src)) throw new Error(`no such file: ${src}`);
    const ogg = path.join(SHIP, `${name}.ogg`);
    const mp3 = path.join(SHIP, `${name}.mp3`);
    let af = [];
    if (!flags.raw) {
      // trim leading+trailing silence, then normalize peak to -1 dB
      const det = spawnCapture(["-i", src, "-af", "volumedetect", "-f", "null", "-"]);
      const max = Number(det.match(/max_volume: ([-\d.]+) dB/)?.[1] ?? 0);
      const trim = "silenceremove=start_periods=1:start_threshold=-60dB";
      af = ["-af", `${trim},areverse,${trim},areverse,volume=${(-1 - max).toFixed(1)}dB`];
    }
    execFileSync(ffmpeg, ["-y", "-i", src, ...af, "-c:a", "libvorbis", "-q:a", "4", "-ac", "1", ogg], { stdio: "pipe" });
    execFileSync(ffmpeg, ["-y", "-i", src, ...af, "-c:a", "libmp3lame", "-q:a", "5", "-ac", "1", mp3], { stdio: "pipe" });
    console.log(`shipped ${path.relative(ROOT, ogg)} + .mp3${flags.raw ? " (raw)" : " (trimmed+normalized)"}`);
    inspectVerbose(ogg);
  } else if (cmd === "credits") {
    try {
      const sub = await client().user.subscription.get();
      console.log(`tier=${sub.tier} used=${sub.characterCount}/${sub.characterLimit} resets=${new Date(sub.nextCharacterCountResetUnix * 1000).toISOString()}`);
    } catch {
      console.log("credits unavailable (API key lacks user_read permission — check usage in the ElevenLabs dashboard)");
    }
  } else {
    throw new Error(`unknown command: ${cmd}`);
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
