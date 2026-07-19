// Deterministic live Phaser QA shot for the four ped-6 texture states.
import { chromium } from 'playwright';

const output = process.argv[2] ?? 'assets/masters/ped-6-live-qa.png';
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(String(error)));

await page.goto(process.env.GAME_URL || 'http://localhost:5199/?nowizard', {
  waitUntil: 'networkidle',
});
await page.waitForFunction(() => window.SP?.scene, null, { timeout: 15000 });
await page.evaluate(() => {
  const scene = window.SP.scene;
  scene.pedTimer = 1e9;
  scene.carTimer = 1e9;
  for (const victim of scene.victims) victim.sprite.destroy();
  scene.victims.length = 0;

  const keys = ['ped-6', 'ped-6-b', 'ped-6-r', 'ped-6-rainbow'];
  const xs = [250, 405, 560, 715];
  for (let index = 0; index < keys.length; index += 1) {
    scene.add
      .image(xs[index], 437, keys[index])
      .setOrigin(0.5, 1)
      .setScale(0.9)
      .setDepth(20);
  }
});
await page.waitForTimeout(500);
await page.screenshot({ path: output });
console.log(`saved ${output}`);
console.log(errors.length ? `console errors: ${errors.join(' | ')}` : 'no console errors');
await browser.close();
