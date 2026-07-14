import Phaser from 'phaser';

/**
 * Per-texture alpha silhouettes for pixel-accurate goo sticking.
 *
 * Victim AABBs stay the broadphase; the sim resolves stick/slide/detach
 * against these masks so goo conforms to the drawn body instead of the box.
 */

export interface AlphaMask {
  w: number;
  h: number;
  /** row-major alpha bytes (0–255) of the source texture */
  data: Uint8Array;
}

/** alpha above this counts as solid; below is the anti-aliased fringe / air */
export const ALPHA_SOLID = 48;

const cache = new Map<string, AlphaMask>();

export function getAlphaMask(scene: Phaser.Scene, key: string): AlphaMask {
  let mask = cache.get(key);
  if (mask) return mask;
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0);
  const rgba = ctx.getImageData(0, 0, src.width, src.height).data;
  const data = new Uint8Array(src.width * src.height);
  for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4 + 3];
  mask = { w: src.width, h: src.height, data };
  cache.set(key, mask);
  return mask;
}
