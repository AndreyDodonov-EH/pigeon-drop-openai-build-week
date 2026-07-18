import Phaser from 'phaser';
import { W, GROUND_Y } from './textures';
import {
  BUILDING_PALETTE_PIPELINE,
  buildingPaletteTint,
} from './BuildingPalettePipeline';

/**
 * Near parallax layer: individual facade sprites spawned by a street planner
 * instead of a baked tile. Buildings get per-instance shader repaints (hue and
 * brightness through the tint attribute), block rules (office clusters, shoulder-
 * to-shoulder Amsterdam canal rows, gappy standalone houses), size jitter, and
 * occasional fence/wall connectors bridging the gaps.
 */

type FacadeKind = 'house' | 'shop' | 'office' | 'canal';

interface FacadeDef {
  key: string;
  kind: FacadeKind;
  flippable: boolean;
  minScale: number;
  maxScale: number;
}

const FACADES: FacadeDef[] = [
  { key: 'bg-building-0', kind: 'house', flippable: true, minScale: 0.82, maxScale: 1.0 },
  { key: 'bg-building-1', kind: 'house', flippable: true, minScale: 0.82, maxScale: 1.0 },
  // the café is drawn in 3/4 view; mirroring reads wrong
  { key: 'bg-building-2', kind: 'shop', flippable: false, minScale: 0.85, maxScale: 1.0 },
  { key: 'bg-building-3', kind: 'office', flippable: true, minScale: 0.9, maxScale: 1.15 },
  // the narrow water-tower house already reads Amsterdam-ish — row it up
  { key: 'bg-building-4', kind: 'canal', flippable: true, minScale: 0.78, maxScale: 1.0 },
  { key: 'bg-building-5', kind: 'canal', flippable: true, minScale: 0.78, maxScale: 1.02 },
  { key: 'bg-building-6', kind: 'canal', flippable: true, minScale: 0.78, maxScale: 1.02 },
  { key: 'bg-building-7', kind: 'office', flippable: true, minScale: 0.9, maxScale: 1.15 },
];

export const BUILDING_SPRITES = FACADES.map((f) => f.key);
export const CONNECTOR_SPRITES = ['bg-fence-0', 'bg-fence-1', 'bg-fence-2'];

// The sidewalk band (depth 1.5) is rendered behind the facades and scrolls at
// the same parallax rate, so buildings stand on it: their bases overlap the
// band and even a facade whose wall base sits above the stoop's bottom step
// (bg-building-0) meets pavement, not sky. The curb/roadway strip (depth 3)
// only starts below the band and stays clear of the building bottoms.
const BASELINE = GROUND_Y - 16;
const SPAWN_AHEAD = 260; // keep the row planned this far past the right edge

interface PlannedItem {
  def: FacadeDef;
  scale: number;
  flip: boolean;
  tint: number;
  gapBefore: number;
  connector?: { key: string; scale: number; tint: number };
}

export class NearBuildingsLayer {
  private scene: Phaser.Scene;
  private depth: number;
  private sprites: Phaser.GameObjects.Image[] = [];
  private queue: PlannedItem[] = [];
  /** screen-space x of the right edge of the last placed element */
  private cursor: number;
  private facades: FacadeDef[];
  private connectors: string[];
  private lastKey = '';

  constructor(scene: Phaser.Scene, depth: number) {
    this.scene = scene;
    this.depth = depth;
    this.facades = FACADES.filter((f) => scene.textures.exists(f.key));
    this.connectors = CONNECTOR_SPRITES.filter((k) => scene.textures.exists(k));
    this.cursor = -60;
    this.update(0);
  }

  /** advance the layer by `dx` px (already parallax-scaled) and top up the row */
  update(dx: number): void {
    this.cursor -= dx;
    this.sprites = this.sprites.filter((s) => {
      s.x -= dx;
      if (s.x + s.displayWidth < -60) {
        s.destroy();
        return false;
      }
      return true;
    });

    if (this.facades.length === 0) return;
    while (this.cursor < W + SPAWN_AHEAD) {
      if (this.queue.length === 0) this.queue.push(...this.planBlock());
      this.place(this.queue.shift()!);
    }
  }

  private place(item: PlannedItem): void {
    let gap = item.gapBefore;
    if (item.connector) {
      const tex = this.scene.textures.get(item.connector.key).getSourceImage();
      const cw = tex.width * item.connector.scale;
      // fence spans the gap with both ends tucked behind the flanking walls
      gap = Math.max(cw - 22, 12);
      const fence = this.scene.add
        .image(this.cursor + (gap - cw) / 2, BASELINE, item.connector.key)
        .setOrigin(0, 1)
        .setScale(item.connector.scale)
        .setDepth(this.depth - 0.05)
        .setTint(item.connector.tint)
        .setPipeline(BUILDING_PALETTE_PIPELINE);
      this.sprites.push(fence);
    }
    const x = this.cursor + gap;
    const sprite = this.scene.add
      .image(x, BASELINE, item.def.key)
      .setOrigin(0, 1)
      .setScale(item.scale)
      .setFlipX(item.flip)
      .setDepth(this.depth)
      .setTint(item.tint)
      .setPipeline(BUILDING_PALETTE_PIPELINE);
    this.sprites.push(sprite);
    this.cursor = x + sprite.displayWidth;
  }

  // ---------------------------------------------------------- planning

  private planBlock(): PlannedItem[] {
    const offices = this.facades.filter((f) => f.kind === 'office');
    const canals = this.facades.filter((f) => f.kind === 'canal');
    const streets = this.facades.filter((f) => f.kind === 'house' || f.kind === 'shop');

    const roll = Math.random();
    let items: PlannedItem[];
    if (offices.length > 0 && roll < 0.26) {
      items = this.officeCluster(offices);
    } else if (canals.length > 0 && roll < 0.58) {
      items = this.canalRow(canals);
    } else {
      items = this.streetStretch(streets.length > 0 ? streets : this.facades);
    }
    // block-leading gap, sometimes bridged by a fence
    items[0].gapBefore = 30 + Math.random() * 90;
    if (this.connectors.length > 0 && Math.random() < 0.5) {
      items[0].connector = this.pickConnector();
    }
    return items;
  }

  /** offices stand shoulder to shoulder, stepped heights */
  private officeCluster(pool: FacadeDef[]): PlannedItem[] {
    const n = 2 + ((Math.random() * 2) | 0);
    const items: PlannedItem[] = [];
    for (let i = 0; i < n; i++) {
      const def = this.pick(pool);
      items.push({
        def,
        scale: this.scaleFor(def),
        flip: def.flippable && Math.random() < 0.5,
        // glass and concrete barely repaint; lean on brightness for variety
        tint: buildingPaletteTint(rnd(0.35), rnd(0.6)),
        gapBefore: Math.random() * 5,
      });
    }
    return items;
  }

  /** Amsterdam-style row: touching, strongly varied paint and heights */
  private canalRow(pool: FacadeDef[]): PlannedItem[] {
    const n = 3 + ((Math.random() * 3) | 0);
    const items: PlannedItem[] = [];
    for (let i = 0; i < n; i++) {
      const def = this.pick(pool);
      items.push({
        def,
        scale: this.scaleFor(def),
        flip: def.flippable && Math.random() < 0.5,
        tint: buildingPaletteTint(rnd(1), rnd(0.45)),
        gapBefore: -2, // shoulder to shoulder, no sky slivers
      });
    }
    return items;
  }

  /** standalone houses/shops with real gaps, often fenced */
  private streetStretch(pool: FacadeDef[]): PlannedItem[] {
    const n = 1 + ((Math.random() * 2) | 0);
    const items: PlannedItem[] = [];
    for (let i = 0; i < n; i++) {
      const def = this.pick(pool);
      const item: PlannedItem = {
        def,
        scale: this.scaleFor(def),
        flip: def.flippable && Math.random() < 0.5,
        tint:
          Math.random() < 0.3
            ? buildingPaletteTint(0, 0) // some keep the original paint job
            : buildingPaletteTint(rnd(0.55), rnd(0.4)),
        gapBefore: i === 0 ? 0 : 24 + Math.random() * 70,
      };
      if (i > 0 && this.connectors.length > 0 && Math.random() < 0.55) {
        item.connector = this.pickConnector();
      }
      items.push(item);
    }
    return items;
  }

  private pickConnector(): { key: string; scale: number; tint: number } {
    return {
      key: this.connectors[(Math.random() * this.connectors.length) | 0],
      scale: 0.46 + Math.random() * 0.1,
      tint: buildingPaletteTint(0, rnd(0.35)),
    };
  }

  private pick(pool: FacadeDef[]): FacadeDef {
    let def = pool[(Math.random() * pool.length) | 0];
    if (def.key === this.lastKey && pool.length > 1) {
      def = pool[(pool.indexOf(def) + 1) % pool.length];
    }
    this.lastKey = def.key;
    return def;
  }

  private scaleFor(def: FacadeDef): number {
    return def.minScale + Math.random() * (def.maxScale - def.minScale);
  }
}

/** uniform in [-amp, amp] */
function rnd(amp: number): number {
  return (Math.random() * 2 - 1) * amp;
}
