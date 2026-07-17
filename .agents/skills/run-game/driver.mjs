// Launch a headless browser, drive the game into a chosen state, screenshot it.
//   node driver.mjs <out.png>
// Edit `setup` for the state you want to verify. Field names are internal to
// GameScene.ts (state/jetH/jetMaxH/splashed, sim.particles, …) — confirm them
// against source; they drift.
import { chromium } from '/home/aadod/_PROJECTS/shitting_pigeon/node_modules/playwright/index.mjs';

const OUT = process.argv[2] || 'shot.png';
const URL = process.env.GAME_URL || 'http://localhost:5199/';

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
await page.waitForFunction(() => window.SP && window.SP.scene, null, { timeout: 15000 });
await page.evaluate(setup);
await page.waitForTimeout(400); // let a few frames render
await page.screenshot({ path: OUT });
console.log('saved', OUT);
await browser.close();
