import Phaser from 'phaser';
import type { GooWind } from '../goo/GooSim';
import { GROUND_Y, MOBILE } from './textures';

const FRAME_A = 'prop-fan-f0';
const FRAME_B = 'prop-fan-f1';
const FAN_DEPTH = 5.04;
/** shoulder-height street prop: a touch shorter than the ~64px pedestrians */
const DISPLAY_H = 58 * (MOBILE ? 1.4 : 1);
// Cage-disc center as fractions of the displayed sprite, measured on the
// shipped frames; the wind cone and gust streaks emanate from this point.
const CAGE_FX = -0.05;
const CAGE_FY = 0.66;

interface PooFan {
  id: number;
  container: Phaser.GameObjects.Container;
  img: Phaser.GameObjects.Image;
  gusts: Phaser.GameObjects.Graphics;
  phase: number;
  spin: number;
  boost: number;
  scored: boolean;
}

/** Animated café-side fans and the matching screen-space wind cones. */
export class PooFanLayer {
  private readonly fans: PooFan[] = [];
  private nextId = 1;
  private ambientTint = 0xffffff;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onHit: (x: number, y: number) => void,
  ) {}

  /** Place a pedestal fan by its base; it blows horizontally to the left. */
  spawn(x: number, y = GROUND_Y - 6): void {
    const gusts = this.scene.add.graphics();
    const img = this.scene.add.image(0, 0, FRAME_A).setOrigin(0.5, 1).setTint(this.ambientTint);
    img.setScale(DISPLAY_H / img.height);
    const container = this.scene.add.container(x, y, [gusts, img]).setDepth(FAN_DEPTH);
    this.fans.push({
      id: this.nextId++,
      container,
      img,
      gusts,
      phase: Math.random() * Math.PI * 2,
      spin: Math.random(),
      boost: 0,
      scored: false,
    });
  }

  /** Move with the near-building plane, flicker the blur frames, draw gusts. */
  update(dx: number, f: number): void {
    let write = 0;
    for (const fan of this.fans) {
      fan.container.x -= dx;
      fan.phase += (0.24 + fan.boost * 0.16) * f;
      fan.spin += (0.14 + fan.boost * 0.1) * f;
      fan.boost = Math.max(0, fan.boost - 0.025 * f);
      fan.img.setTexture(Math.floor(fan.spin) % 2 === 0 ? FRAME_A : FRAME_B);
      fan.img.setScale(DISPLAY_H / fan.img.height);
      fan.container.rotation = Math.sin(fan.phase * 0.13) * 0.008;
      this.drawGusts(fan);

      if (fan.container.x < -90) {
        fan.container.destroy(true);
      } else {
        this.fans[write++] = fan;
      }
    }
    this.fans.length = write;
  }

  /** Multiply the metal prop into the same day/night light as the street. */
  setAmbient(tint: number): void {
    if (tint === this.ambientTint) return;
    this.ambientTint = tint;
    for (const fan of this.fans) fan.img.setTint(tint);
  }

  /** Fresh cones are cheap and guarantee current positions after scrolling. */
  windFields(): GooWind[] {
    return this.fans.map((fan) => ({
      id: fan.id,
      x: fan.container.x + this.cageX(fan),
      y: fan.container.y + this.cageY(fan),
      dirX: -1,
      dirY: 0,
      reach: 300,
      startRadius: 26,
      spread: 0.2,
      strength: 5,
      maxSpeed: 22,
      engageDistance: 80,
      onEngage: () => this.engage(fan),
    }));
  }

  get count(): number {
    return this.fans.length;
  }

  private cageX(fan: PooFan): number {
    return fan.img.displayWidth * CAGE_FX;
  }

  private cageY(fan: PooFan): number {
    return -fan.img.displayHeight * CAGE_FY;
  }

  private engage(fan: PooFan): void {
    fan.boost = 1;
    if (fan.scored) return;
    fan.scored = true;
    this.onHit(fan.container.x + this.cageX(fan), fan.container.y + this.cageY(fan));
  }

  /**
   * Cartoon wind: three lanes of wavy streaks streaming downwind from the
   * cage, each ending in a small puff, strongest at the cage and fading out.
   */
  private drawGusts(fan: PooFan): void {
    const g = fan.gusts;
    g.clear();
    const ox = this.cageX(fan);
    const oy = this.cageY(fan);
    const dirX = -1;
    const dirY = 0;
    const perpX = -dirY;
    const perpY = dirX;
    const energy = 0.44 + fan.boost * 0.32;
    const reach = 110 + fan.boost * 30;
    for (let lane = -1; lane <= 1; lane++) {
      for (let dash = 0; dash < 4; dash++) {
        const t0 = (dash * 0.26 + fan.phase * 0.02 + lane * 0.09 + 1) % 1;
        const t1 = Math.min(1, t0 + 0.17);
        // strong right off the cage, fading out toward the end of the cone
        const alpha = energy * (1 - t0 * 0.75);
        g.lineStyle(lane === 0 ? 2.6 : 2, 0xf2fbff, alpha);
        g.beginPath();
        for (let step = 0; step <= 6; step++) {
          const t = t0 + ((t1 - t0) * step) / 6;
          const d = 8 + t * reach;
          const side =
            lane * (7 + t * 13) + Math.sin(fan.phase * 0.9 + t * 9 + lane * 2) * (2 + t * 6);
          const x = ox + dirX * d + perpX * side;
          const y = oy + dirY * d + perpY * side;
          if (step === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokePath();
        // little puff at the head of each streak
        const hd = 8 + t1 * reach;
        const hs =
          lane * (7 + t1 * 13) + Math.sin(fan.phase * 0.9 + t1 * 9 + lane * 2) * (2 + t1 * 6);
        g.fillStyle(0xf2fbff, alpha * 0.55);
        g.fillCircle(ox + dirX * hd + perpX * hs, oy + dirY * hd + perpY * hs, 2.4);
      }
    }
  }
}
