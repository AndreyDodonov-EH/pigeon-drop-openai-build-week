---
name: run-game
description: Launch the Phaser game in a headless browser and screenshot a specific game state to verify a visual change. Use whenever you need to see a sprite, effect, or scene live in the actual app (hydrant jet, goo/poop sim, rainbow mode, pigeon states) rather than judging a static asset. Drives the game via its `window.SP` debug hooks and Playwright.
model: sonnet
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# Running & screenshotting the game

Phaser 3 + Vite browser game. To verify a visual change you make sure the dev
server is up, drive the scene into the state you care about via the
`window.SP` debug hooks, and screenshot the canvas.

## 1. Reuse the dev server (port 5199 is reserved for this project)

`vite.config.ts` pins port 5199 (`strictPort`) and host `::`, so plain
`npm run dev` and this skill always land on the same server. The user usually
keeps one running persistently — check before launching anything:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5199/   # 200 → server already up, skip launch
```

Only if that is not 200, launch one — and **leave it running afterwards**
(no cleanup step; the user wants a persistent server to watch via HMR):

```bash
npx vite > <scratchpad>/vite.log 2>&1 &   # port/host come from vite.config.ts (run from repo root)
until grep -q "Local:" <scratchpad>/vite.log; do sleep 0.5; done
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5199/   # expect 200
```

The background wrapper may report "completed" immediately — ignore that; the
server is up if the port returns 200. A launch failing with a port-in-use
error just means a server appeared in the meantime — recheck with curl and
reuse it.

## 2. The `SP` debug hook

`createScene()` exposes `window.SP` (see `src/scenes/GameScene.ts`, search
`window as unknown`). **Verify this surface against the source before relying
on it — it's internal and drifts.** Currently:

- `SP.scene` — the GameScene (has `.hydrants`, `.sim.particles`, `.pigeonY`, …)
- `SP.spawnHydrant()` — spawn a hydrant (starts idle, off-screen right)
- `SP.spawnRainbowPickup(x?, y?)` — spawn the rainbow pickup at a chosen screen position
- `SP.setFly(bool)` / `SP.setPoop(bool)` / `SP.setRainbow(bool)`
- `SP.particleCount()` / `SP.pigeonY()` / `SP.rainbowRemaining()`

## 3. Force a deterministic state, then screenshot

Timed states (hydrant burst, poop) won't be on-screen at screenshot time, so
reach into the object and set its fields directly. Field names are internal —
confirm them in `GameScene.ts` (`state`, `jetH`, `jetMaxH`, `splashed`).

Driver template: [driver.mjs](driver.mjs). Run it with an output path:

```bash
node .agents/skills/run-game/driver.mjs <scratchpad>/shot.png
```

It imports Playwright from the repo `node_modules`, uses a 960×540 viewport,
waits for `window.SP`, applies a state-setup callback, waits a few frames, and
screenshots. Edit the `setup` block in the copy (or inline the eval) for the
state you need — the shipped example parks a hydrant on-screen in full burst.

The driver loads `/?nowizard`, which suppresses the first-run "how to play"
overlay (headless pages get fresh localStorage, so without it every run would
sit behind the dimmed overlay — see `shouldShowWizard` in
`src/ui/FirstRunWizard.ts`). Keep the param in any custom URL; drop it (or use
`?wizard`) only when the overlay itself is what you're screenshotting.

**Then Read the screenshot and actually look at it.** A blank frame is a launch
failure, not a pass.

Harmless noise to ignore: `GL Driver Message ... ReadPixels` WebGL stall
warnings on screenshot.

## Cleanup

None — do **not** kill the vite server. It stays up so the user can watch the
game via HMR between sessions. Screenshots in a headless page never disturb
the user's open tab: each browser connection gets its own game instance and
`SP` state.
