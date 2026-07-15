// Forces a hydrant burst directly under the pigeon and checks the scare-poop fires.
import { chromium } from 'playwright';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 980, height: 560 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForFunction(() => typeof window.SP !== 'undefined', { timeout: 10000 });
await page.waitForTimeout(500);

// park a hydrant under the pigeon, mid-burst
await page.evaluate(() => {
  const s = window.SP.scene;
  s.spawnHydrant();
  const h = s.hydrants[s.hydrants.length - 1];
  h.sprite.x = s.pigeon.x;
  h.state = 'burst';
  h.timer = 130;
  h.jetMaxH = 300;
});
await page.waitForTimeout(700);
const res = await page.evaluate(() => ({
  dumpKind: window.SP.scene.dumpKind,
  meter: window.SP.scene.meter,
  combo: window.SP.scene.combo,
  splashed: window.SP.scene.hydrants.at(-1).splashed,
}));
console.log(JSON.stringify(res));
await page.screenshot({ path: 'shots/verify/5-sploosh.png' });
await page.waitForTimeout(1800);
const after = await page.evaluate(() => ({
  dumpKind: window.SP.scene.dumpKind,
  meter: window.SP.scene.meter,
}));
console.log('later:', JSON.stringify(after));
console.log(errors.length ? `console errors:\n${errors.join('\n')}` : 'no console errors');
await browser.close();
