import Phaser from 'phaser';
import { W, GROUND_Y } from './textures';
import {
  BUILDING_PALETTE_PIPELINE,
  buildingPaletteTint,
} from './BuildingPalettePipeline';
import {
  CONNECTOR_KEYS,
  FACADE_DEFS,
  NearBuildingsPlanner,
  type FacadeDef,
  type PlannedBlockSummary,
  type PlannedItem,
} from './NearBuildingsPlanner';

/**
 * Near parallax layer: individual facade sprites spawned by a street planner
 * instead of a baked tile. A pure semantic planner groups coherent districts,
 * reserves deep-perspective facades for right-hand corners, and supplies the
 * per-instance palette controls consumed by the building shader.
 */

export const BUILDING_SPRITES = FACADE_DEFS.map((facade) => facade.key);
export const CONNECTOR_SPRITES = [...CONNECTOR_KEYS];

export interface NearFacadePlacement {
  use: FacadeDef['use'];
  x: number;
  y: number;
  width: number;
  height: number;
}

// The sidewalk band (depth 1.5) is rendered behind the facades and scrolls at
// the same parallax rate, so buildings stand on it: their bases overlap the
// band and even a facade whose wall base sits above the stoop's bottom step
// (bg-building-0) meets pavement, not sky. The curb/roadway strip (depth 3)
// only starts below the band and stays clear of the building bottoms.
const BASELINE = GROUND_Y - 16;
const SPAWN_AHEAD = 260; // keep the row planned this far past the right edge

export class NearBuildingsLayer {
  private scene: Phaser.Scene;
  private depth: number;
  private sprites: Phaser.GameObjects.Image[] = [];
  private queue: PlannedItem[] = [];
  /** screen-space x of the right edge of the last placed element */
  private cursor: number;
  private facades: FacadeDef[];
  private connectors: string[];
  private planner: NearBuildingsPlanner;
  private lastPlacedWasCorner = false;
  /** emissive overlays (lit café windows), alpha driven by DayNight glow */
  private glows: Phaser.GameObjects.Image[] = [];
  private glowAlpha = 0;

  constructor(
    scene: Phaser.Scene,
    depth: number,
    private readonly onFacadePlaced?: (placement: NearFacadePlacement) => void,
  ) {
    this.scene = scene;
    this.depth = depth;
    this.facades = FACADE_DEFS.filter((facade) => scene.textures.exists(facade.key));
    this.connectors = CONNECTOR_SPRITES.filter((key) => scene.textures.exists(key));
    this.planner = new NearBuildingsPlanner(this.facades, this.connectors);
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

    if (!this.planner.hasFacades) return;
    let placements = 0;
    while (this.cursor < W + SPAWN_AHEAD && placements < 64) {
      if (this.queue.length === 0) this.queue.push(...this.planner.nextBlock().items);
      this.place(this.queue.shift()!);
      placements += 1;
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
        .setTint(buildingPaletteTint(item.connector.hueShift, item.connector.brightness))
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
      .setTint(buildingPaletteTint(item.hueShift, item.brightness))
      .setPipeline(BUILDING_PALETTE_PIPELINE);
    this.sprites.push(sprite);
    // the café gets an emissive lit-windows overlay that fades in after dark;
    // plain ADD blend, no repaint pipeline — warm light is warm on any paint job
    const glowKey = `${item.def.key}-lit`;
    if (this.scene.textures.exists(glowKey)) {
      const glow = this.scene.add
        .image(x, BASELINE, glowKey)
        .setOrigin(0, 1)
        .setScale(item.scale)
        .setFlipX(item.flip)
        .setDepth(this.depth + 0.01)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(this.glowAlpha);
      this.sprites.push(glow);
      this.glows.push(glow);
    }
    this.onFacadePlaced?.({
      use: item.def.use,
      x,
      y: BASELINE,
      width: sprite.displayWidth,
      height: sprite.displayHeight,
    });
    this.cursor = x + sprite.displayWidth;
    this.lastPlacedWasCorner = item.def.placement === 'right-corner';
  }

  /** Debug: force a semantic mini-block containing this facade to enter next. */
  queueNext(key: string): void {
    const block = this.planner.planFeature(key);
    if (!block) return;
    // The planner may have speculatively planned items that are still queued.
    // Anchor this debug block to the last facade actually placed in the world.
    block.items[0].gapBefore = this.lastPlacedWasCorner ? 96 : 24;
    block.items[0].connector = undefined;
    this.queue = block.items;
  }

  /** Headless QA surface: plan summaries without constructing Phaser objects. */
  debugPlan(count: number): PlannedBlockSummary[] {
    let state = 0x51de57;
    const seededRandom = (): number => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    return new NearBuildingsPlanner(this.facades, this.connectors, seededRandom).debugPlan(count);
  }

  /** set the emissive-window intensity (0 = day, 1 = deep night) */
  setGlow(alpha: number): void {
    this.glowAlpha = alpha;
    this.glows = this.glows.filter((g) => g.active);
    for (const g of this.glows) g.setAlpha(alpha);
  }

}
