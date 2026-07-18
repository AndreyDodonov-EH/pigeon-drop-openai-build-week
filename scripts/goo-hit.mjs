// Regression check for fast goo crossing moving-target silhouettes in one frame.
import { chromium } from 'playwright';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 980, height: 560 } });
const errors = [];
page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto(process.env.GAME_URL || 'http://localhost:5199/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.SP);

const results = await page.evaluate(() => {
  const scene = window.SP.scene;
  scene.scene.pause();

  const check = (kind) => {
    if (kind === 'car') scene.spawnCar();
    else scene.spawnPed();
    const victim = scene.victims.at(-1);
    victim.sprite.x = 420;
    victim.collider.x = 420;
    victim.collider.vx = kind === 'car' ? -4.5 : -2.1;

    scene.sim.particles.length = 0;
    let hits = 0;
    victim.collider.onHit = () => hits++;

    const startY = victim.collider.y - victim.collider.hh - 30;
    // Cross the complete target in one simulation step: endpoint collision
    // misses this, while the swept alpha-mask test must catch it.
    const vy = victim.collider.hh * 2 + 70;
    scene.sim.emit(victim.collider.x, startY, victim.collider.vx, vy, 0xf2ecd4);
    scene.sim.step([victim.collider]);
    const particle = scene.sim.particles[0];
    return {
      kind,
      hits,
      stuck: particle?.state === 1,
      localY: particle ? Math.round(particle.sy) : null,
    };
  };

  return [check('ped'), check('car')];
});

await browser.close();

for (const result of results) {
  console.log(`${result.kind}: hits=${result.hits}, stuck=${result.stuck}, localY=${result.localY}`);
  if (result.hits !== 1 || !result.stuck) process.exitCode = 1;
}
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
}
