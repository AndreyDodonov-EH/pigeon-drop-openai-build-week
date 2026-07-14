// Headless screenshot driver: boots the game, simulates play, captures frames.
// Usage: node scripts/shot.mjs [outDir] [--rainbow]
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = process.argv[2] ?? 'shots';
const rainbow = process.argv.includes('--rainbow');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 980, height: 560 } });

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForFunction(() => typeof window.SP !== 'undefined', { timeout: 10000 });
await page.waitForTimeout(600);

const sp = (fn) => page.evaluate(fn);

if (rainbow) await sp(() => window.SP.setRainbow(true));

// fly up a bit, then hold the poop stream while bobbing
await sp(() => window.SP.setFly(true));
await page.waitForTimeout(450);
await sp(() => window.SP.setFly(false));
await sp(() => window.SP.setPoop(true));
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/1-stream-early.png` });

await page.waitForTimeout(600);
await page.screenshot({ path: `${outDir}/2-stream-falling.png` });

await sp(() => window.SP.setFly(true));
await page.waitForTimeout(500);
await sp(() => window.SP.setFly(false));
await page.screenshot({ path: `${outDir}/3-stream-arc.png` });

await page.waitForTimeout(800);
await sp(() => window.SP.setPoop(false));
await page.screenshot({ path: `${outDir}/4-puddles.png` });

await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/5-settled.png` });

const count = await sp(() => window.SP.particleCount());
console.log(`particles alive at end: ${count}`);
if (errors.length) {
  console.log('--- console errors ---');
  for (const e of errors) console.log(e);
} else {
  console.log('no console errors');
}

await browser.close();
