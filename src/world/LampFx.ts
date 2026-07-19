import Phaser from 'phaser';

/**
 * After-dark life for a street lamp: a warm additive halo + bright core on
 * the lantern head, a slow gas-lamp shimmer, and a few moths spiralling in
 * the light. Alpha follows the DayNight glow value, so the whole thing is
 * invisible in daylight and fades in with dusk.
 */
export class LampFx {
  private halo: Phaser.GameObjects.Image;
  private core: Phaser.GameObjects.Image;
  private moths: Phaser.GameObjects.Graphics;
  private phase = Math.random() * 20;
  private flickerT = Math.random() * 100;

  constructor(
    scene: Phaser.Scene,
    private lamp: Phaser.GameObjects.Image,
  ) {
    const d = lamp.depth;
    this.halo = scene.add
      .image(0, 0, 'lamp-glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(d + 0.001)
      .setScale(1.5)
      .setAlpha(0);
    this.core = scene.add
      .image(0, 0, 'lamp-glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(d + 0.001)
      .setScale(0.42)
      .setAlpha(0);
    this.moths = scene.add.graphics().setDepth(d + 0.002);
    this.update(0, 0);
  }

  update(f: number, glow: number): void {
    this.phase += 0.045 * f;
    this.flickerT += f;
    // two incommensurate sines: a soft shimmer that never reads as a strobe
    const flicker =
      0.9 + 0.06 * Math.sin(this.flickerT * 0.21) + 0.04 * Math.sin(this.flickerT * 0.083 + 1.7);
    // lantern head sits near the top of the sprite (~0.39 of its height above center)
    const x = this.lamp.x;
    const y = this.lamp.y - this.lamp.displayHeight * 0.39;
    this.halo.setPosition(x, y).setAlpha(glow * 0.34 * flicker);
    this.core.setPosition(x, y).setAlpha(glow * 0.85 * flicker);

    this.moths.clear();
    // moths only bother showing up once the lamp is properly lit
    const mothA = Phaser.Math.Clamp((glow - 0.55) / 0.45, 0, 1);
    if (mothA > 0) {
      this.moths.fillStyle(0xf0e6c0, 0.85 * mothA);
      for (let i = 0; i < 3; i++) {
        const ang = this.phase * (0.7 + i * 0.23) + i * 2.1;
        const r = 12 + 6 * Math.sin(this.phase * (0.9 + i * 0.3) + i);
        this.moths.fillRect(x + Math.cos(ang) * r * 1.5, y + Math.sin(ang) * r - 2, 2, 2);
      }
    }
  }

  destroy(): void {
    this.halo.destroy();
    this.core.destroy();
    this.moths.destroy();
  }
}
