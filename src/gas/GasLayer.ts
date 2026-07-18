import Phaser from 'phaser';
import type { GasParticle } from './GasSim';

const STAMP_KEY = 'gas-cloud-stamp';
const STAMP_SIZE = 128;

/** Draws expanding gas parcels as overlapping, soft multi-lobed clouds. */
export class GasLayer {
  private rt: Phaser.GameObjects.RenderTexture;
  private stamp: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, width: number, height: number, depth: number) {
    ensureGasStamp(scene);
    this.rt = scene.add.renderTexture(0, 0, width, height).setOrigin(0, 0).setDepth(depth);
    this.stamp = scene.make.image({ key: STAMP_KEY, add: false });
  }

  render(particles: GasParticle[]): void {
    this.rt.clear();
    if (particles.length === 0) return;
    this.rt.beginDraw();
    for (const p of particles) {
      const scale = (p.radius * 2) / STAMP_SIZE;
      this.stamp
        .setScale(scale * 1.16, scale * 0.9)
        .setRotation(p.phase * p.spin * 12)
        .setAlpha(p.alpha)
        .setTint(p.tint);
      this.rt.batchDraw(this.stamp, p.x, p.y);
    }
    this.rt.endDraw();
  }
}

function ensureGasStamp(scene: Phaser.Scene): void {
  if (scene.textures.exists(STAMP_KEY)) return;
  const canvas = scene.textures.createCanvas(STAMP_KEY, STAMP_SIZE, STAMP_SIZE);
  if (!canvas) throw new Error('failed to create gas cloud stamp');
  const ctx = canvas.getContext();

  // Five overlapping radial lobes form an irregular cloud. The soft edge is
  // essential: liquid uses a threshold shader, while gas must stay diffuse.
  const lobes = [
    [64, 65, 43, 0.78],
    [43, 61, 29, 0.62],
    [83, 53, 32, 0.64],
    [77, 79, 31, 0.58],
    [52, 82, 26, 0.5],
  ] as const;
  for (const [x, y, radius, strength] of lobes) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255,255,255,${strength})`);
    gradient.addColorStop(0.42, `rgba(255,255,255,${strength * 0.72})`);
    gradient.addColorStop(0.76, `rgba(255,255,255,${strength * 0.22})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  canvas.refresh();
}
