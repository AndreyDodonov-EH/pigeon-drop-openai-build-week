---
name: run-game
description: Launch the Phaser game in a headless browser and screenshot a specific game state to verify a visual change. Use whenever you need to see a sprite, effect, or scene live in the actual app (hydrant jet, goo/poop sim, rainbow mode, pigeon states) rather than judging a static asset. Drives the game via its `window.SP` debug hooks and Playwright.
---

# Running & screenshotting the game

Phaser 3 + Vite browser game. To verify a visual change you launch the dev
server, drive the scene into the state you care about via the `window.SP`
debug hooks, and screenshot the canvas.

## 1. Launch the dev server

```bash
cd /home/aadod/_PROJECTS/shitting_pigeon
npx vite --port 5199 --host :: > <scratchpad>/vite.log 2>&1 &   # background; --host :: exposes it on the LAN too (WSL is configured for this)
until grep -q "Local:" <scratchpad>/vite.log; do sleep 0.5; done
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5199/   # expect 200
```

The background wrapper may report "completed" immediately — ignore that; the
server is up if the port returns 200.

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
node .Codex/skills/run-game/driver.mjs <scratchpad>/shot.png
```

It imports Playwright from the repo `node_modules`, uses a 960×540 viewport,
waits for `window.SP`, applies a state-setup callback, waits a few frames, and
screenshots. Edit the `setup` block in the copy (or inline the eval) for the
state you need — the shipped example parks a hydrant on-screen in full burst.

**Then Read the screenshot and actually look at it.** A blank frame is a launch
failure, not a pass.

Harmless noise to ignore: `GL Driver Message ... ReadPixels` WebGL stall
warnings on screenshot.

## Cleanup

Kill the vite process when done (`pkill -f "vite --port 5199"`).
