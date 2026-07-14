import Phaser from 'phaser';

/**
 * Procedural placeholder textures. Everything here gets replaced by generated
 * art later — palette is matched to the portrait references (slate blue bird,
 * purple accents, warm tan backdrop).
 */

export const W = 960;
export const H = 540;
export const GROUND_Y = 484;

export function buildTextures(scene: Phaser.Scene): void {
  sky(scene);
  buildings(scene, 'bg-far', 0x8d94ad, 0x7e859e, 180, 300, false);
  buildings(scene, 'bg-near', 0x5c6480, 0x515970, 260, 420, true);
  street(scene);
  shadow(scene);
}

function sky(scene: Phaser.Scene): void {
  const c = scene.textures.createCanvas('sky', 32, H)!;
  const ctx = c.getContext();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#b7d4e8');
  g.addColorStop(0.55, '#d9c9a8');
  g.addColorStop(1, '#c8ab7c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, H);
  c.refresh();
}

function buildings(
  scene: Phaser.Scene,
  key: string,
  color: number,
  colorAlt: number,
  minH: number,
  maxH: number,
  windows: boolean,
): void {
  const g = scene.add.graphics();
  let x = 0;
  let flip = false;
  while (x < W) {
    const bw = 60 + Math.random() * 100;
    const bh = minH + Math.random() * (maxH - minH);
    const clipped = Math.min(bw, W - x);
    g.fillStyle(flip ? color : colorAlt, 1);
    g.fillRect(x, H - bh, clipped, bh);
    if (windows) {
      g.fillStyle(0x3a405a, 0.7);
      for (let wy = H - bh + 18; wy < H - 40; wy += 34) {
        for (let wx = x + 10; wx < x + clipped - 14; wx += 26) {
          if (Math.random() < 0.75) g.fillRect(wx, wy, 12, 16);
        }
      }
    }
    x += bw;
    flip = !flip;
  }
  g.generateTexture(key, W, H);
  g.destroy();
}

function street(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const h = H - GROUND_Y + 30;
  // sidewalk strip then asphalt
  g.fillStyle(0xa9a294, 1);
  g.fillRect(0, 0, W, 14);
  g.fillStyle(0x91897b, 1);
  g.fillRect(0, 14, W, 6);
  g.fillStyle(0x4c4a52, 1);
  g.fillRect(0, 20, W, h - 20);
  // lane dashes
  g.fillStyle(0xd8d2c0, 0.8);
  for (let x = 0; x < W; x += 80) g.fillRect(x, h - 18, 42, 5);
  g.generateTexture('street', W, h);
  g.destroy();
}

function shadow(scene: Phaser.Scene): void {
  const sg = scene.add.graphics();
  sg.fillStyle(0x000000, 0.28);
  sg.fillEllipse(30, 8, 60, 14);
  sg.generateTexture('shadow', 60, 16);
  sg.destroy();
}

