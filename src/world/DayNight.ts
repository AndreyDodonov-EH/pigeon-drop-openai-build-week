import Phaser from 'phaser';
import { W, H } from './textures';

/**
 * Time-of-day cycle: day → dusk → night → dawn, looping (~3 min per lap).
 * Owns the two stacked full-screen sky images and crossfades them; everything
 * else (sprite tints, shader ambient uniforms, lamp/café glow, lit far
 * windows) polls this class for interpolated values each frame. Deliberately
 * no full-screen tint overlay — that was tried as a mood vignette and read as
 * a filter (see CHANGELOG); the light lives in the objects instead.
 */

export type DayLook = 'day' | 'dusk' | 'night' | 'dawn';

interface LookCfg {
  /** multiplier for world scenery: buildings, street, props, far skyline */
  ambient: [number, number, number];
  /** gentler multiplier for actors (pigeon, victims, pickups) so gameplay stays readable */
  actor: [number, number, number];
  /** emissive intensity: street lamps, café windows */
  glow: number;
  /** far-skyline lit-windows overlay alpha */
  farWin: number;
  /** cloud visibility multiplier */
  cloud: number;
}

const LOOKS: Record<DayLook, LookCfg> = {
  day: { ambient: [1, 1, 1], actor: [1, 1, 1], glow: 0, farWin: 0, cloud: 1 },
  dusk: {
    ambient: [1.0, 0.87, 0.76],
    actor: [1.0, 0.93, 0.87],
    glow: 0.6,
    farWin: 0.55,
    cloud: 0.85,
  },
  night: {
    ambient: [0.55, 0.61, 0.85],
    actor: [0.75, 0.79, 0.96],
    glow: 1,
    farWin: 1,
    cloud: 0.3,
  },
  dawn: {
    ambient: [1.0, 0.89, 0.85],
    actor: [1.0, 0.94, 0.92],
    glow: 0.25,
    farWin: 0.25,
    cloud: 0.8,
  },
};

/** each look holds, then blends into the next across `blend` seconds;
 * the session opens at t=0 in full daylight (a dawn start was tried and
 * rolled back — day one starts mid-morning) */
const SEGMENTS: { look: DayLook; hold: number; blend: number }[] = [
  { look: 'day', hold: 58, blend: 14 },
  { look: 'dusk', hold: 12, blend: 14 },
  { look: 'night', hold: 52, blend: 14 },
  { look: 'dawn', hold: 9, blend: 12 },
];
const CYCLE = SEGMENTS.reduce((s, seg) => s + seg.hold + seg.blend, 0);

const SKY_KEY: Record<DayLook, string> = {
  day: 'sky',
  dusk: 'sky-dusk',
  night: 'sky-night',
  dawn: 'sky-dawn',
};

export class DayNight {
  private t = 0; // seconds into the cycle
  private from: DayLook = SEGMENTS[0].look;
  private to: DayLook = SEGMENTS[0].look;
  private blend = 0; // 0 = pure `from`, 1 = pure `to`
  private skyBase: Phaser.GameObjects.Image;
  private skyOver: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.skyBase = scene.add
      .image(0, 0, SKY_KEY[SEGMENTS[0].look])
      .setOrigin(0, 0)
      .setDisplaySize(W, H)
      .setDepth(0);
    this.skyOver = scene.add
      .image(0, 0, SKY_KEY[SEGMENTS[0].look])
      .setOrigin(0, 0)
      .setDisplaySize(W, H)
      .setDepth(0.02)
      .setAlpha(0);
  }

  /** advance by `f` 60Hz-frames and refresh the sky crossfade */
  update(f: number): void {
    this.t = (this.t + f / 60) % CYCLE;
    let rem = this.t;
    for (let i = 0; i < SEGMENTS.length; i++) {
      const seg = SEGMENTS[i];
      if (rem < seg.hold) {
        this.from = seg.look;
        this.to = seg.look;
        this.blend = 0;
        break;
      }
      rem -= seg.hold;
      if (rem < seg.blend) {
        this.from = seg.look;
        this.to = SEGMENTS[(i + 1) % SEGMENTS.length].look;
        // smoothstep: the long crossfades ease in and out instead of popping
        const s = rem / seg.blend;
        this.blend = s * s * (3 - 2 * s);
        break;
      }
      rem -= seg.blend;
    }

    if (this.skyBase.texture.key !== SKY_KEY[this.from]) {
      this.skyBase.setTexture(SKY_KEY[this.from]).setDisplaySize(W, H);
    }
    if (this.skyOver.texture.key !== SKY_KEY[this.to]) {
      this.skyOver.setTexture(SKY_KEY[this.to]).setDisplaySize(W, H);
    }
    this.skyOver.setAlpha(this.blend);
  }

  private num(pick: (c: LookCfg) => number): number {
    return pick(LOOKS[this.from]) * (1 - this.blend) + pick(LOOKS[this.to]) * this.blend;
  }

  private lerpVec(pick: (c: LookCfg) => [number, number, number]): [number, number, number] {
    const a = pick(LOOKS[this.from]);
    const b = pick(LOOKS[this.to]);
    const k = this.blend;
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  }

  ambientVec(): [number, number, number] {
    return this.lerpVec((c) => c.ambient);
  }

  actorVec(): [number, number, number] {
    return this.lerpVec((c) => c.actor);
  }

  ambientTint(): number {
    return packTint(this.ambientVec());
  }

  actorTint(): number {
    return packTint(this.actorVec());
  }

  get glow(): number {
    return this.num((c) => c.glow);
  }

  get farWindowAlpha(): number {
    return this.num((c) => c.farWin);
  }

  get cloudAlpha(): number {
    return this.num((c) => c.cloud);
  }

  /** how deep into night we are, 0..1 (blend-weighted) */
  get nightness(): number {
    return (
      (this.from === 'night' ? 1 - this.blend : 0) + (this.to === 'night' ? this.blend : 0)
    );
  }

  get isNight(): boolean {
    return this.nightness > 0.5;
  }

  /** debug: skip ahead to the middle of the next look's hold */
  jumpNext(): void {
    const current = this.blend < 0.5 ? this.from : this.to;
    const i = SEGMENTS.findIndex((seg) => seg.look === current);
    this.jump(SEGMENTS[(i + 1) % SEGMENTS.length].look);
  }

  /** debug/screenshot hook: jump to the middle of a look's hold */
  jump(look: DayLook): void {
    let t = 0;
    for (const seg of SEGMENTS) {
      if (seg.look === look) {
        this.t = t + seg.hold * 0.5;
        this.update(0);
        return;
      }
      t += seg.hold + seg.blend;
    }
  }

  info(): { from: DayLook; to: DayLook; blend: number; t: number } {
    return { from: this.from, to: this.to, blend: this.blend, t: this.t };
  }
}

function packTint([r, g, b]: [number, number, number]): number {
  const ch = (v: number): number => Phaser.Math.Clamp(Math.round(v * 255), 0, 255);
  return (ch(r) << 16) | (ch(g) << 8) | ch(b);
}
