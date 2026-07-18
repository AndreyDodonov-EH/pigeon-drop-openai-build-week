import Phaser from 'phaser';

/**
 * World background: procedural canvas textures (sky, far skyline, street).
 * The near building layer lives in NearBuildings.ts; clouds and street
 * furniture are generated sprites driven by GameScene. Palette matched to the
 * portrait references — slate blue bird, purple accents, warm tan backdrop.
 */

export const W = 960;
export const H = 540;
export const GROUND_Y = 484;

export function buildTextures(scene: Phaser.Scene): void {
  sky(scene);
  farSkyline(scene);
  sidewalk(scene);
  street(scene);
  shadow(scene);
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

// ---------------------------------------------------------- far skyline

/**
 * Two hazy silhouette rows in one tile: a paler distant row behind a nearer
 * one, with water towers, antennas, AC boxes and sparse lit windows.
 */
function farSkyline(scene: Phaser.Scene): void {
  const c = scene.textures.createCanvas('bg-far', W, H)!;
  const ctx = c.getContext();

  skylineRow(ctx, ['#a7aec5', '#9ba3ba'], 230, 350, false);
  skylineRow(ctx, ['#8d94ad', '#7e859e', '#868da6'], 170, 290, true);

  // atmospheric fade: the whole layer melts into the warm horizon haze
  const haze = ctx.createLinearGradient(0, H - 340, 0, H);
  haze.addColorStop(0, 'rgba(226, 205, 166, 0)');
  haze.addColorStop(1, 'rgba(226, 205, 166, 0.55)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, W, H);

  c.refresh();
}

function skylineRow(
  ctx: CanvasRenderingContext2D,
  tones: string[],
  minH: number,
  maxH: number,
  detailed: boolean,
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
  const c = scene.textures.createCanvas('sidewalk', W, SIDEWALK_H)!;
  const ctx = c.getContext();

  // slabs with joints and per-slab tone shifts (60 divides W: seamless)
  ctx.fillStyle = '#a9a294';
  ctx.fillRect(0, 0, W, SIDEWALK_H);
  for (let sx = 0; sx < W; sx += 60) {
    if ((sx / 60) % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(sx, 0, 60, SIDEWALK_H);
    }
    ctx.fillStyle = '#8f887a';
    ctx.fillRect(sx, 0, 1, SIDEWALK_H);
  }
  ctx.fillStyle = 'rgba(143, 136, 122, 0.5)';
  ctx.fillRect(0, 8, W, 1);
  ctx.fillRect(0, 16, W, 1);

  c.refresh();
}

// Curb and roadway: the full-scroll-speed gameplay ground, in front of the
// buildings; starts right where the sidewalk band ends.
function street(scene: Phaser.Scene): void {
  const h = H - GROUND_Y + 6;
  const c = scene.textures.createCanvas('street', W, h)!;
  const ctx = c.getContext();

  // curb: sunlit lip over a shaded face, then the gutter shadow line
  ctx.fillStyle = '#bcb5a5';
  ctx.fillRect(0, 0, W, 2);
  ctx.fillStyle = '#7c7568';
  ctx.fillRect(0, 2, W, 5);
  ctx.fillStyle = '#3e3c44';
  ctx.fillRect(0, 7, W, 4);

  // asphalt with tonal patches, speckle grain and tar cracks
  ctx.fillStyle = '#4c4a52';
  ctx.fillRect(0, 11, W, h - 11);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.07)';
    ctx.beginPath();
    ctx.ellipse(
      80 + ((i * 173.7) % (W - 160)),
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
    const sx = 4 + ((i * 37.37) % (W - 8));
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
      ctx.lineTo(Math.min(cx, W - 10), Math.max(14, Math.min(h - 4, cy)));
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

  // lane dashes, slightly worn (80 divides W: seamless)
  for (let x = 0; x < W; x += 80) {
    ctx.fillStyle = 'rgba(216, 210, 192, 0.8)';
    ctx.fillRect(x, h - 18, 42, 5);
    ctx.fillStyle = 'rgba(76, 74, 82, 0.35)';
    ctx.fillRect(x + 6 + (x % 3) * 9, h - 17, 5, 3);
  }

  c.refresh();
}

function shadow(scene: Phaser.Scene): void {
  const sg = scene.add.graphics();
  sg.fillStyle(0x000000, 0.28);
  sg.fillEllipse(30, 8, 60, 14);
  sg.generateTexture('shadow', 60, 16);
  sg.destroy();
}
