import { chromium } from 'playwright';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 980, height: 560 } });
page.on('console', (m) => m.type() === 'error' && console.log('console error:', m.text()));
await page.goto(process.env.GAME_URL || 'http://localhost:5199/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.SP);
// let victims spawn and spread out
await page.waitForTimeout(6000);
// force a splat reaction on every live victim
const n = await page.evaluate(() => {
  const s = window.SP.scene;
  for (const v of s.victims) {
    v.hitCooldown = 0;
    s.onSplat(v, { x: v.sprite.x, y: v.sprite.y }, 5);
  }
  return s.victims.map((v) => `${v.kind}-${v.variant}`).join(', ');
});
console.log('splatted:', n);
await page.waitForTimeout(400); // mid-reaction, popups visible
await page.screenshot({ path: process.argv[2] ?? 'react-verify.png' });
await browser.close();
