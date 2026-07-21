import Phaser from 'phaser';

const CREAM = 0xf3ead8;
const COLOR_CREAM = '#f3ead8';
const COLOR_INK = '#1d1f2a';

export interface LoadBarOpts {
  /** bar center x and top y, in whatever coordinate space the scene draws in */
  cx: number;
  y: number;
  width: number;
  height: number;
  /** percent-readout size in the same units; pass 0 to show the bar alone */
  fontSize: number;
  depth?: number;
  /** text resolution multiplier — pass RES when the camera zooms world units */
  resolution?: number;
  /** fade the finished bar out over this many ms instead of removing it
   * instantly; only safe when the camera framing won't change underneath it */
  fadeOutMs?: number;
}

/**
 * Slim cream progress bar (plus optional percent readout) bound to the
 * scene's loader. Removes itself and its listeners when the load completes.
 */
export function attachLoadBar(scene: Phaser.Scene, opts: LoadBarOpts): void {
  const { cx, y, width, height, fontSize, depth = 0, resolution = 1, fadeOutMs = 0 } = opts;
  const x = cx - width / 2;
  const track = scene.add.graphics().setDepth(depth);
  track
    .lineStyle(2, CREAM, 0.35)
    .strokeRoundedRect(x - 5, y - 5, width + 10, height + 10, (height + 10) / 2);
  const fill = scene.add.graphics().setDepth(depth);
  const parts: (Phaser.GameObjects.Graphics | Phaser.GameObjects.Text)[] = [track, fill];
  let pct: Phaser.GameObjects.Text | undefined;
  if (fontSize > 0) {
    pct = scene.add
      .text(cx, y - fontSize * 0.6, '0%', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: `${fontSize}px`,
        color: COLOR_CREAM,
        stroke: COLOR_INK,
        strokeThickness: Math.max(3, Math.round(fontSize * 0.15)),
        resolution,
      })
      .setOrigin(0.5, 1)
      .setDepth(depth);
    parts.push(pct);
  }
  const onProgress = (v: number): void => {
    // keep the fill at least one cap wide so the rounded ends never invert
    fill
      .clear()
      .fillStyle(CREAM, 1)
      .fillRoundedRect(x, y, Math.max(height, width * v), height, height / 2);
    pct?.setText(`${Math.round(v * 100)}%`);
  };
  scene.load.on(Phaser.Loader.Events.PROGRESS, onProgress);
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
    scene.load.off(Phaser.Loader.Events.PROGRESS, onProgress);
    if (fadeOutMs > 0 && scene.scene.isActive()) {
      scene.tweens.add({
        targets: parts,
        alpha: 0,
        duration: fadeOutMs,
        onComplete: () => parts.forEach((p) => p.destroy()),
      });
    } else {
      parts.forEach((p) => p.destroy());
    }
  });
}
