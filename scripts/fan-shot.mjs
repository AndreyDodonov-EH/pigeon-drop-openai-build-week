// Deterministic live QA for the café fan: align it under the stream, dump,
// assert the trick-shot bonus, and save the bent trajectory for visual review.
import { chromium } from 'playwright';

const out = process.argv[2] || '/tmp/pigeon-drop-fan.png';
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto(process.env.GAME_URL || 'http://localhost:5199/?nowizard', {
  waitUntil: 'domcontentloaded',
  timeout: 15000,
});
// A fresh headless profile starts on the title scene; enter the game before
// waiting for GameScene's debug surface.
await page.waitForTimeout(350);
await page.mouse.click(480, 300);
await page.waitForFunction(() => window.SP?.scene, null, { timeout: 10000 });
await page.evaluate(() => {
  const scene = window.SP.scene;
  scene.pedTimer = 1e9;
  scene.carTimer = 1e9;
  scene.hydrantTimer = 1e9;
  scene.rainbowPickupTimer = 1e9;
  scene.itemPickupTimer = 1e9;
  for (const victim of scene.victims) {
    victim.headlights?.destroy();
    victim.sprite.destroy();
  }
  scene.victims = [];
  scene.meter = 80;
  window.SP.spawnFan(270);
  window.SP.setPoop(true);
});

await page.waitForTimeout(700);
await page.evaluate(() => window.SP.setPoop(false));
const stats = await page.evaluate(() => {
  const scene = window.SP.scene;
  const particles = scene.guanoFx.gooSim.particles;
  return {
    score: scene.score,
    combo: scene.combo,
    fanCount: window.SP.fanCount(),
    particleCount: particles.length,
    leftmostAirborneX: Math.round(
      Math.min(...particles.filter((p) => !p.groundHit).map((p) => p.x)),
    ),
  };
});
await page.screenshot({ path: out });
await browser.close();

console.log(JSON.stringify(stats));
console.log(`saved ${out}`);
if (stats.score < 50 || stats.combo < 1 || stats.particleCount < 1) process.exitCode = 1;
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
}
