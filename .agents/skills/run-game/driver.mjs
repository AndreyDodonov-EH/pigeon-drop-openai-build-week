// Launch a headless browser, drive the game into a chosen state, screenshot it.
//   node driver.mjs <out.png>
// Edit `setup` for the state you want to verify. Field names are internal to
// GameScene.ts (state/jetH/jetMaxH/splashed, sim.particles, …) — confirm them
// against source; they drift.
import { chromium } from '/home/aadod/_PROJECTS/pigeon_drop/node_modules/playwright/index.mjs';

const OUT = process.argv[2] || 'shot.png';
// Debug flags (all optional, drop any that get in the way of the shot):
//   nowizard — skip the first-run "how to play" overlay (headless pages get
//              fresh localStorage, so it would appear every run)
//   notitle  — boot straight into GameScene, no title tap/reveal wait
//   nospawn  — freeze timer-driven spawns (peds/cars/hydrants/props/pickups)
//              so the frame only contains what `setup` staged; call
//              SP.setAutoSpawn(true) in setup if you want organic traffic
//   mute     — no music/sfx
const URL = process.env.GAME_URL || 'http://localhost:5199/?nowizard&notitle&nospawn&mute';

// Runs in the page. Default: park a hydrant on-screen in a full burst.
function setup() {
  const SP = window.SP;
  SP.spawnHydrant();
  const h = SP.scene.hydrants[SP.scene.hydrants.length - 1];
  h.sprite.x = 480;
  h.state = 'burst';
  h.timer = 100000;   // don't reseat
  h.jetMaxH = 300;
  h.jetH = 300;       // full height immediately
  h.splashed = true;  // skip splash side-effects
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('console', (m) => console.log('[page]', m.text()));
// retry until the dev server is accepting connections
for (let i = 0; ; i++) {
  try { await page.goto(URL, { waitUntil: 'networkidle' }); break; }
  catch (e) {
    if (i >= 40) throw e;
    await new Promise((r) => setTimeout(r, 500));
  }
}
// ?notitle boots straight into GameScene, so SP appears on its own. Only if
// it doesn't (GAME_URL pointing at a build without the flag, where the title
// waits for input) fall back to keypress-nudging — not before, since in
// GameScene a stray Space is gameplay input.
try {
  await page.waitForFunction(() => window.SP && window.SP.scene, null, { timeout: 5000 });
} catch {
  for (let i = 0; i < 30; i++) {
    if (await page.evaluate(() => !!(window.SP && window.SP.scene))) break;
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
  }
  await page.waitForFunction(() => window.SP && window.SP.scene, null, { timeout: 1000 });
}
await page.evaluate(setup);
await page.waitForTimeout(400); // let a few frames render
await page.screenshot({ path: OUT });
console.log('saved', OUT);
await browser.close();
