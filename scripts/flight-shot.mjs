// Verifies: default altitude, altitude hold, climb/dive, hydrant burst + scare-poop.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = process.argv[2] ?? 'shots/verify';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 980, height: 560 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(process.env.GAME_URL || 'http://localhost:5199/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => typeof window.SP !== 'undefined', { timeout: 10000 });
await page.waitForTimeout(500);
const sp = (fn) => page.evaluate(fn);

const y0 = await sp(() => window.SP.pigeonY());
console.log(`default altitude y=${y0.toFixed(1)} (want 150)`);

// altitude hold: no input for 2s, y should barely move
await page.waitForTimeout(2000);
const y1 = await sp(() => window.SP.pigeonY());
console.log(`after 2s hands-off y=${y1.toFixed(1)} drift=${(y1 - y0).toFixed(1)} (want ~0)`);
await page.screenshot({ path: `${outDir}/1-hold.png` });

// climb for 1s, then release and check it holds the new line
await sp(() => window.SP.setFly(true));
await page.waitForTimeout(1000);
await sp(() => window.SP.setFly(false));
const y2 = await sp(() => window.SP.pigeonY());
await page.waitForTimeout(1500);
const y3 = await sp(() => window.SP.pigeonY());
console.log(`after climb y=${y2.toFixed(1)}, 1.5s later y=${y3.toFixed(1)} drift=${(y3 - y2).toFixed(1)}`);

// dive via keyboard
await page.keyboard.down('ArrowDown');
await page.waitForTimeout(1200);
await page.keyboard.up('ArrowDown');
const y4 = await sp(() => window.SP.pigeonY());
console.log(`after 1.2s dive y=${y4.toFixed(1)} (should be well below ${y3.toFixed(1)})`);

// hydrant: spawn one, let it scroll under the pigeon and burst
await sp(() => window.SP.spawnHydrant());
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/2-hydrant-warn.png` });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/3-hydrant-burst.png` });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/4-hydrant-late.png` });

console.log(errors.length ? `console errors:\n${errors.join('\n')}` : 'no console errors');
await browser.close();
