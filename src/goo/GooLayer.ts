import Phaser from 'phaser';
import { GooPipeline } from './GooPipeline';
import type { Particle } from './GooSim';

const STAMP_KEY = 'goo-stamp';
const STAMP_SIZE = 64;
/** visual stamp radius vs. physical particle radius — overlap makes blobs merge */
const STAMP_SCALE = 2.7;

/**
 * Draws the particle field into a RenderTexture each frame and runs the
 * metaball threshold shader over it.
 */
export class GooLayer {
  private rt: Phaser.GameObjects.RenderTexture;
  private stamp: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, width: number, height: number, depth: number) {
    ensureStampTexture(scene);

    const renderer = scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    if (!renderer.pipelines.getPostPipeline('GooPipeline')) {
      renderer.pipelines.addPostPipeline('GooPipeline', GooPipeline);
    }

    this.rt = scene.add.renderTexture(0, 0, width, height).setOrigin(0, 0).setDepth(depth);
    this.rt.setPostPipeline(GooPipeline);

    this.stamp = scene.make.image({ key: STAMP_KEY, add: false });
  }

  render(particles: Particle[]): void {
    const rt = this.rt;
    rt.clear();
    if (particles.length === 0) return;
    rt.beginDraw();
    for (const p of particles) {
      const visR = p.r * STAMP_SCALE * p.fade;
      if (visR <= 0.5) continue;
      const s = (visR * 2) / STAMP_SIZE;
      // settled drops squash into wide flat ribbons, so street trails merge
      // into a smooth puddle line instead of a caterpillar of round humps
      const sq = Math.min(p.settled / 40, 1) * 0.4;
      this.stamp.setScale(s * (1 + sq * 0.9), s * (1 - sq));
      this.stamp.setTint(p.tint);
      rt.batchDraw(this.stamp, p.x, p.y);
    }
    rt.endDraw();
  }
}

function ensureStampTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(STAMP_KEY)) return;
  const canvas = scene.textures.createCanvas(STAMP_KEY, STAMP_SIZE, STAMP_SIZE);
  if (!canvas) throw new Error('failed to create goo stamp canvas');
  const ctx = canvas.getContext();
  const half = STAMP_SIZE / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  // smooth field falloff — the shader thresholds around 0.3–0.4
  grad.addColorStop(0.0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.62)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.22)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STAMP_SIZE, STAMP_SIZE);
  canvas.refresh();
}
