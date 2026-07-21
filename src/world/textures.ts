import Phaser from 'phaser';

/**
 * World background: procedural canvas textures (sky, far skyline, street).
 * The near building layer lives in NearBuildings.ts; clouds and street
 * furniture are generated sprites driven by GameScene. Palette matched to the
 * portrait references — slate blue bird, purple accents, warm tan backdrop.
 */

export const H = 540;
export const GROUND_Y = 484;

/** Fixed build width for the periodic ground textures (sidewalk slabs every
 * 60px, lane dashes every 80px — both divide 960). The tileSprites repeat
 * this tile, so they stay seamless whatever W ends up being. */
const TILE_W = 960;

/** Design height is fixed at 540 — all vertical gameplay is tuned to it. The
 * width stretches to the viewport's aspect ratio so the playfield fills the
 * screen edge-to-edge instead of pillarboxing: phones (coarse pointer) use the
 * device screen (landscape long/short, since play is landscape), desktop uses
 * the browser window at load. Clamped between 16:9 (960) and ~21:9. */
export const MOBILE = window.matchMedia('(pointer: coarse)').matches;

export const W = (() => {
  const long = MOBILE ? Math.max(screen.width, screen.height) : window.innerWidth;
  const short = MOBILE ? Math.min(screen.width, screen.height) : window.innerHeight;
  return Math.round(H * Math.min(Math.max(long / short, 960 / 540), 1280 / 540));
})();

/** Supersampling factor. Layout stays in W×540 design space, but the canvas
 * backing buffer is RES× larger and each scene's camera zooms by RES to match
 * — otherwise the 540-tall buffer gets CSS-upscaled and every asset blurs, no
 * matter how sharp the source PNG. Desktop sizes it to the screen's physical
 * height (the fullscreen worst case), capped at 3× to bound fill-rate.
 * Phones stay at 1×: the goo/gas PostFX shaders run full-canvas passes every
 * frame, and at 2×+ their fragment cost visibly tanked phone framerates.
 * `?res=N` overrides for experiments on any device. Pointer coordinates
 * (pointer.x/y) arrive in canvas pixels, so divide by RES before comparing
 * against design-space values. */
export const RES = (() => {
  const override = Number(new URLSearchParams(location.search).get('res'));
  if (override >= 1 && override <= 4) return override;
  if (MOBILE) return 1;
  const dpr = window.devicePixelRatio || 1;
  return Math.min(Math.max((screen.height * dpr) / H, 1), 3);
})();

export function buildTextures(scene: Phaser.Scene): void {
  sky(scene);
  skyDusk(scene);
  skyNight(scene);
  skyDawn(scene);
  farSkyline(scene);
  sidewalk(scene);
  street(scene);
  shadow(scene);
  lampGlow(scene);
  headlightBeam(scene);
}

/** height of the sidewalk band the near buildings stand on */
export const SIDEWALK_H = 24;

// ---------------------------------------------------------------- sky

function sky(scene: Phaser.Scene): void {
  const c = scene.textures.createCanvas('sky', W, H)!;
  const ctx = c.getContext();

  // late-afternoon wash: cool blue up top sinking into warm tan at the horizon
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#9ec8e4');
  g.addColorStop(0.32, '#c2d3da');
  g.addColorStop(0.55, '#e0d0aa');
  g.addColorStop(0.78, '#e5c493');
  g.addColorStop(1, '#d2ad7c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // sun upper-left-ish (matches the facade lighting), clear of the HUD portrait
  const sunX = 320;
  const sunY = 92;
  const glow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 120);
  glow.addColorStop(0, 'rgba(255, 247, 214, 0.9)');
  glow.addColorStop(0.35, 'rgba(255, 240, 190, 0.35)');
  glow.addColorStop(1, 'rgba(255, 240, 190, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 120, sunY - 120, 240, 240);
  ctx.fillStyle = '#fff3c9';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
  ctx.fill();

  // low haze band that the far skyline sinks into
  const haze = ctx.createLinearGradient(0, H * 0.6, 0, H);
  haze.addColorStop(0, 'rgba(233, 212, 170, 0)');
  haze.addColorStop(1, 'rgba(233, 212, 170, 0.5)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, H * 0.6, W, H * 0.4);

  c.refresh();
}

// The other three time-of-day skies. DayNight crossfades full-screen images
// of these, so each is a complete standalone sky, not an overlay.

function skyDusk(scene: Phaser.Scene): void {
  const c = scene.textures.createCanvas('sky-dusk', W, H)!;
  const ctx = c.getContext();

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#46508a');
  g.addColorStop(0.34, '#8a6f9e');
  g.addColorStop(0.58, '#d98d6a');
  g.addColorStop(0.8, '#f0a95e');
  g.addColorStop(1, '#d7834f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // the same sun as the day sky, now fat, orange and sinking toward the roofs
  const sunX = 320;
  const sunY = 248;
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 160);
  glow.addColorStop(0, 'rgba(255, 205, 130, 0.95)');
  glow.addColorStop(0.4, 'rgba(255, 165, 95, 0.4)');
  glow.addColorStop(1, 'rgba(255, 150, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 160, sunY - 160, 320, 320);
  ctx.fillStyle = '#ffd9a0';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
  ctx.fill();

  // thin banded clouds catching the last light
  ctx.fillStyle = 'rgba(255, 190, 140, 0.28)';
  for (let i = 0; i < 4; i++) {
    const by = 120 + i * 46 + (i % 2) * 14;
    ctx.fillRect(((i * 331) % W) - 120, by, 260 + (i % 3) * 90, 5 + (i % 2) * 3);
  }

  const haze = ctx.createLinearGradient(0, H * 0.6, 0, H);
  haze.addColorStop(0, 'rgba(214, 122, 80, 0)');
  haze.addColorStop(1, 'rgba(214, 122, 80, 0.45)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, H * 0.6, W, H * 0.4);

  c.refresh();
}

function skyNight(scene: Phaser.Scene): void {
  const c = scene.textures.createCanvas('sky-night', W, H)!;
  const ctx = c.getContext();

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#111527');
  g.addColorStop(0.45, '#1a2140');
  g.addColorStop(0.75, '#283052');
  g.addColorStop(1, '#39395c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // deterministic star field, thinning toward the horizon haze
  for (let i = 0; i < 110; i++) {
    const sx = (i * 97.31 + 13) % W;
    const sy = ((i * 53.77 + 7) % (H * 0.66)) * (0.94 + ((i * 7) % 5) * 0.012);
    const twinkle = 0.25 + ((i * 37) % 60) / 90;
    ctx.fillStyle =
      i % 9 === 0 ? `rgba(255, 231, 186, ${twinkle})` : `rgba(226, 234, 255, ${twinkle})`;
    const s = i % 11 === 0 ? 2 : 1;
    ctx.fillRect(sx, sy, s, s);
  }

  // full moon, clear of the right-side HUD numbers
  const mx = W * 0.76;
  const my = 118;
  const glow = ctx.createRadialGradient(mx, my, 4, mx, my, 95);
  glow.addColorStop(0, 'rgba(226, 232, 255, 0.55)');
  glow.addColorStop(0.4, 'rgba(210, 220, 255, 0.18)');
  glow.addColorStop(1, 'rgba(210, 220, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(mx - 95, my - 95, 190, 190);
  ctx.fillStyle = '#eceadb';
  ctx.beginPath();
  ctx.arc(mx, my, 26, 0, Math.PI * 2);
  ctx.fill();
  // craters and a cool shaded limb keep it painterly instead of a flat disc
  ctx.fillStyle = 'rgba(120, 128, 150, 0.22)';
  for (const [ox, oy, r] of [
    [-8, -4, 5],
    [6, 8, 7],
    [10, -9, 3.5],
    [-3, 12, 3],
  ]) {
    ctx.beginPath();
    ctx.arc(mx + ox, my + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(40, 52, 90, 0.16)';
  ctx.beginPath();
  ctx.arc(mx - 7, my, 26, Math.PI * 0.45, Math.PI * 1.55);
  ctx.fill();

  const haze = ctx.createLinearGradient(0, H * 0.6, 0, H);
  haze.addColorStop(0, 'rgba(44, 52, 88, 0)');
  haze.addColorStop(1, 'rgba(44, 52, 88, 0.55)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, H * 0.6, W, H * 0.4);

  c.refresh();
}

function skyDawn(scene: Phaser.Scene): void {
  const c = scene.textures.createCanvas('sky-dawn', W, H)!;
  const ctx = c.getContext();

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#5c6a9e');
  g.addColorStop(0.4, '#9b8bb0');
  g.addColorStop(0.65, '#e3a98f');
  g.addColorStop(0.85, '#f6c992');
  g.addColorStop(1, '#f2b97e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // sun barely up, same spot the day sky's sun will occupy — the crossfade
  // into day reads as it climbing
  const sunX = 320;
  const sunY = 268;
  const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 130);
  glow.addColorStop(0, 'rgba(255, 236, 190, 0.85)');
  glow.addColorStop(0.45, 'rgba(255, 210, 150, 0.3)');
  glow.addColorStop(1, 'rgba(255, 210, 150, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 130, sunY - 130, 260, 260);
  ctx.fillStyle = '#ffe9bd';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 19, 0, Math.PI * 2);
  ctx.fill();

  // a last faint star or two clinging on up top
  ctx.fillStyle = 'rgba(230, 236, 255, 0.35)';
  ctx.fillRect(W * 0.62, 46, 1, 1);
  ctx.fillRect(W * 0.81, 74, 1, 1);
  ctx.fillRect(W * 0.35, 30, 1, 1);

  const haze = ctx.createLinearGradient(0, H * 0.6, 0, H);
  haze.addColorStop(0, 'rgba(242, 190, 150, 0)');
  haze.addColorStop(1, 'rgba(242, 190, 150, 0.45)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, H * 0.6, W, H * 0.4);

  c.refresh();
}

// ---------------------------------------------------------- far skyline

/**
 * Two hazy silhouette rows in one tile: a paler distant row behind a nearer
 * one, with water towers, antennas, AC boxes and sparse lit windows.
 */
function farSkyline(scene: Phaser.Scene): void {
  const c = scene.textures.createCanvas('bg-far', W, H)!;
  const ctx = c.getContext();
  // Lit-windows-only overlay, drawn in the same pass so every window sits on
  // its building; a tileSprite of it fades in over bg-far after dark.
  const lit = scene.textures.createCanvas('bg-far-lit', W, H)!;
  const litCtx = lit.getContext();

  skylineRow(ctx, ['#a7aec5', '#9ba3ba'], 230, 350, false, litCtx);
  skylineRow(ctx, ['#8d94ad', '#7e859e', '#868da6'], 170, 290, true, litCtx);

  // atmospheric fade: the whole layer melts into the warm horizon haze
  const haze = ctx.createLinearGradient(0, H - 340, 0, H);
  haze.addColorStop(0, 'rgba(226, 205, 166, 0)');
  haze.addColorStop(1, 'rgba(226, 205, 166, 0.55)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, W, H);

  c.refresh();
  lit.refresh();
}

function skylineRow(
  ctx: CanvasRenderingContext2D,
  tones: string[],
  minH: number,
  maxH: number,
  detailed: boolean,
  litCtx?: CanvasRenderingContext2D,
): void {
  let x = 0;
  let i = 0;
  while (x < W) {
    const bw = Math.min(54 + Math.random() * 96, W - x);
    const bh = minH + Math.random() * (maxH - minH);
    const top = H - bh;
    const tone = tones[i++ % tones.length];
    ctx.fillStyle = tone;
    ctx.fillRect(x, top, bw, bh);

    // roof clutter, clipped away from the tile seam so the wrap stays clean
    const dark = shade(tone, -18);
    ctx.fillStyle = dark;
    if (bw > 30 && x + bw < W - 4) {
      const roll = Math.random();
      if (roll < 0.3) {
        // wooden water tower on stilts
        const tx = x + bw * 0.5 - 9;
        ctx.fillRect(tx + 2, top - 20, 14, 16);
        ctx.fillRect(tx, top - 24, 18, 5);
        ctx.fillRect(tx + 3, top - 4, 2, 4);
        ctx.fillRect(tx + 13, top - 4, 2, 4);
      } else if (roll < 0.55) {
        // antenna mast
        const tx = x + 8 + Math.random() * (bw - 16);
        ctx.fillRect(tx, top - 26, 2, 26);
        ctx.fillRect(tx - 5, top - 18, 12, 2);
        // aircraft-warning beacon, only visible after dark
        if (litCtx) {
          litCtx.fillStyle = 'rgba(255, 96, 84, 0.9)';
          litCtx.fillRect(tx - 1, top - 28, 3, 3);
        }
      } else if (roll < 0.8) {
        // AC / stairwell boxes
        ctx.fillRect(x + bw * 0.15, top - 8, bw * 0.28, 8);
        ctx.fillRect(x + bw * 0.6, top - 5, bw * 0.2, 5);
      }
      // parapet lip
      ctx.fillRect(x, top, bw, 3);
    }

    if (detailed) {
      // sparse windows: mostly shadowed, a few catching warm light
      for (let wy = top + 14; wy < H - 60; wy += 26) {
        for (let wx = x + 8; wx < x + bw - 12; wx += 20) {
          const r = Math.random();
          // after dark roughly half the homes have someone in — the daytime
          // warm ones plus a fresh random set light up on the overlay
          if (litCtx && (r < 0.14 || Math.random() < 0.42)) {
            litCtx.fillStyle = 'rgba(255, 214, 130, 0.1)';
            litCtx.fillRect(wx - 3, wy - 3, 14, 18);
            litCtx.fillStyle = 'rgba(250, 216, 140, 0.9)';
            litCtx.fillRect(wx, wy, 8, 12);
          }
          if (r < 0.14) {
            ctx.fillStyle = 'rgba(244, 226, 170, 0.75)';
          } else if (r < 0.72) {
            ctx.fillStyle = 'rgba(58, 64, 90, 0.35)';
          } else {
            continue;
          }
          ctx.fillRect(wx, wy, 8, 12);
        }
      }
    } else if (litCtx) {
      // the distant unlit row gets sparse pinprick windows so it doesn't
      // vanish into the night sky entirely
      for (let k = 0; k < bw / 24; k++) {
        if (Math.random() < 0.35) {
          litCtx.fillStyle = 'rgba(244, 214, 150, 0.55)';
          litCtx.fillRect(x + 6 + Math.random() * (bw - 14), top + 12 + Math.random() * (bh * 0.5), 4, 6);
        }
      }
    }
    x += bw;
  }
}

/** lighten (amt > 0) or darken a #rrggbb color */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number): number => Math.max(0, Math.min(255, v + amt));
  const r = ch(n >> 16);
  const g = ch((n >> 8) & 0xff);
  const b = ch(n & 0xff);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// -------------------------------------------------------------- street

// The pavement the buildings stand on: rendered behind the facades and
// scrolled at the near-building parallax rate so slab joints don't slide
// under the stoops. Deep enough that facades whose wall base sits above the
// stoop's bottom step (bg-building-0) still meet pavement, not sky.
function sidewalk(scene: Phaser.Scene): void {
  const c = scene.textures.createCanvas('sidewalk', TILE_W, SIDEWALK_H)!;
  const ctx = c.getContext();

  // slabs with joints and per-slab tone shifts (60 divides TILE_W: seamless)
  ctx.fillStyle = '#a9a294';
  ctx.fillRect(0, 0, TILE_W, SIDEWALK_H);
  for (let sx = 0; sx < TILE_W; sx += 60) {
    if ((sx / 60) % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(sx, 0, 60, SIDEWALK_H);
    }
    ctx.fillStyle = '#8f887a';
    ctx.fillRect(sx, 0, 1, SIDEWALK_H);
  }
  ctx.fillStyle = 'rgba(143, 136, 122, 0.5)';
  ctx.fillRect(0, 8, TILE_W, 1);
  ctx.fillRect(0, 16, TILE_W, 1);

  c.refresh();
}

// Curb and roadway: the full-scroll-speed gameplay ground, in front of the
// buildings; starts right where the sidewalk band ends.
function street(scene: Phaser.Scene): void {
  const h = H - GROUND_Y + 6;
  const c = scene.textures.createCanvas('street', TILE_W, h)!;
  const ctx = c.getContext();

  // curb: sunlit lip over a shaded face, then the gutter shadow line
  ctx.fillStyle = '#bcb5a5';
  ctx.fillRect(0, 0, TILE_W, 2);
  ctx.fillStyle = '#7c7568';
  ctx.fillRect(0, 2, TILE_W, 5);
  ctx.fillStyle = '#3e3c44';
  ctx.fillRect(0, 7, TILE_W, 4);

  // asphalt with tonal patches, speckle grain and tar cracks
  ctx.fillStyle = '#4c4a52';
  ctx.fillRect(0, 11, TILE_W, h - 11);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.07)';
    ctx.beginPath();
    ctx.ellipse(
      80 + ((i * 173.7) % (TILE_W - 160)),
      18 + ((i * 31) % (h - 30)),
      55 + (i % 3) * 30,
      9 + (i % 2) * 5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  for (let i = 0; i < 260; i++) {
    // deterministic scatter keeps the speckle off the tile seam
    const sx = 4 + ((i * 37.37) % (TILE_W - 8));
    const sy = 13 + ((i * 17.93) % (h - 16));
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.14)';
    ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, 1);
  }
  ctx.strokeStyle = 'rgba(43, 42, 49, 0.75)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    let cx = 120 + i * 300 + Math.random() * 60;
    let cy = 16 + Math.random() * (h - 36);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 6; s++) {
      cx += 8 + Math.random() * 14;
      cy += (Math.random() - 0.5) * 12;
      ctx.lineTo(Math.min(cx, TILE_W - 10), Math.max(14, Math.min(h - 4, cy)));
    }
    ctx.stroke();
  }

  // manhole cover
  const mx = 620;
  const my = h - 26;
  ctx.fillStyle = '#3a3841';
  ctx.beginPath();
  ctx.ellipse(mx, my, 17, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b2a31';
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.ellipse(mx, my, 12, 4, 0, 0, Math.PI * 2);
  ctx.stroke();

  // lane dashes, slightly worn (80 divides TILE_W: seamless)
  for (let x = 0; x < TILE_W; x += 80) {
    ctx.fillStyle = 'rgba(216, 210, 192, 0.8)';
    ctx.fillRect(x, h - 18, 42, 5);
    ctx.fillStyle = 'rgba(76, 74, 82, 0.35)';
    ctx.fillRect(x + 6 + (x % 3) * 9, h - 17, 5, 3);
  }

  c.refresh();
}

/** soft warm radial disc, reused (rescaled) for the street-lamp halo and core */
function lampGlow(scene: Phaser.Scene): void {
  const S = 128;
  const c = scene.textures.createCanvas('lamp-glow', S, S)!;
  const ctx = c.getContext();
  const g = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2 - 2);
  g.addColorStop(0, 'rgba(255, 228, 160, 0.95)');
  g.addColorStop(0.3, 'rgba(255, 200, 110, 0.42)');
  g.addColorStop(1, 'rgba(255, 170, 70, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  c.refresh();
}

/** Soft left-facing cone; alpha is strongest at the lamp and feathered at the edges. */
function headlightBeam(scene: Phaser.Scene): void {
  const width = 256;
  const height = 96;
  const c = scene.textures.createCanvas('headlight-beam', width, height)!;
  const ctx = c.getContext();
  const pixels = ctx.createImageData(width, height);
  const midY = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const along = x / (width - 1); // 0 = far edge, 1 = lamp
      const halfH = 4 + (1 - along) * 39;
      const across = Math.abs(y + 0.5 - midY) / halfH;
      if (across >= 1) continue;

      const edge = 1 - across;
      const distanceFade = Math.pow(along, 0.72);
      const alpha = Math.round(170 * distanceFade * edge * edge);
      const i = (y * width + x) * 4;
      pixels.data[i] = 255;
      pixels.data[i + 1] = 229;
      pixels.data[i + 2] = 166;
      pixels.data[i + 3] = alpha;
    }
  }

  ctx.putImageData(pixels, 0, 0);
  c.refresh();
}

function shadow(scene: Phaser.Scene): void {
  const sg = scene.add.graphics();
  sg.fillStyle(0x000000, 0.28);
  sg.fillEllipse(30, 8, 60, 14);
  sg.generateTexture('shadow', 60, 16);
  sg.destroy();
}
