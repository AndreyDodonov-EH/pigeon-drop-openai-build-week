/**
 * Guano fluid simulation.
 *
 * Particle-based viscoelastic fluid after Clavet, Beaudoin & Poulin (SCA 2005):
 * "double density relaxation" — each step, particles are displaced to satisfy
 * both a rest density (incompressibility) and a near-density (anti-clustering)
 * constraint. The near-pressure term is what produces surface tension and the
 * gloopy clumping that reads as liquid rather than as loose sand.
 *
 * Simulation runs in frame units: velocities are px/frame at 60 Hz, dt = 1.
 */

import { ALPHA_SOLID, type AlphaMask } from './alphaMask';

export const enum PState {
  Free = 0,
  Stuck = 1, // glued to a collider (a victim), slowly dripping down
}

export interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  r: number;
  tint: number;
  state: PState;
  /** frames since spawn */
  age: number;
  /** frames spent resting on the ground; drives puddle absorption */
  settled: number;
  /** 1 → 0 shrink factor as the particle expires */
  fade: number;
  stickId: number;
  sx: number;
  sy: number;
  dead: boolean;
}

export interface Collider {
  id: number;
  x: number; // center
  y: number;
  hw: number; // half extents
  hh: number;
  vx: number; // px/frame, for friction / stuck-follow
  vy: number;
  sticky: boolean;
  /**
   * Sprite silhouette (center-origin) for pixel-accurate stick/drip.
   * Absent → plain AABB behavior. The owner keeps this pointing at the
   * *currently displayed* texture, so a reaction-frame swap moves the
   * silhouette and shakes loose any goo left hanging in mid-air.
   */
  mask?: AlphaMask;
  scaleX?: number;
  scaleY?: number;
  flipX?: boolean;
  onHit?: (p: Particle, impactSpeed: number) => void;
}

export interface GooParams {
  h: number; // interaction radius
  gravity: number;
  restDensity: number;
  stiffness: number;
  nearStiffness: number;
  viscSigma: number; // linear viscosity
  viscBeta: number; // quadratic viscosity (splat damping)
  airEntrainX: number; // how fast free drops pick up the world's leftward air speed
  maxParticles: number;
  settleFrames: number; // rest duration before a puddle starts absorbing
  fadeFrames: number; // shrink duration once absorbing
  stickSpeed: number; // min impact speed to glue onto a sticky collider
  dripSlide: number; // px/frame a stuck particle slides down its victim
}

export const DEFAULT_PARAMS: GooParams = {
  h: 20,
  gravity: 0.42,
  restDensity: 4.0,
  stiffness: 0.035,
  nearStiffness: 0.16,
  viscSigma: 0.04,
  viscBeta: 0.12,
  airEntrainX: 0.02,
  maxParticles: 750,
  settleFrames: 110,
  fadeFrames: 45,
  stickSpeed: 2.2,
  dripSlide: 0.35,
};

const CELL_SHIFT = 5; // 32px cells (~h)
const HASH_W = 1024;

export class GooSim {
  readonly params: GooParams;
  readonly particles: Particle[] = [];
  /** leftward speed of the world (px/frame); ground drags puddles along */
  worldVx = 0;
  groundY = 480;
  boundsW = 960;

  private grid = new Map<number, number[]>();
  private pool: Particle[] = [];
  /** aperiodic 0–1 random walk driving shade wander along the emitted stream */
  private shadeK = Math.random();

  constructor(params: Partial<GooParams> = {}) {
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  emit(x: number, y: number, vx: number, vy: number, tint: number, count = 1): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.params.maxParticles) this.reapOldest();
      const p = this.pool.pop() ?? ({} as Particle);
      p.x = x + (Math.random() - 0.5) * 6;
      p.y = y + (Math.random() - 0.5) * 6;
      p.vx = vx + (Math.random() - 0.5) * 1.6;
      p.vy = vy + (Math.random() - 0.5) * 1.2;
      p.px = p.x - p.vx;
      p.py = p.y - p.vy;
      p.r = 3.0 + Math.random() * 1.6;
      // low-frequency shade wander + per-drop jitter: darker bands streak
      // through the flow, so the merged mass reads as marbled guano rather
      // than uniform cream foam (per-drop noise alone averages away).
      // Random walk, not a sine — periodic bands read as caterpillar segments.
      this.shadeK += (Math.random() - 0.5) * 0.14;
      this.shadeK = this.shadeK < 0 ? -this.shadeK : this.shadeK > 1 ? 2 - this.shadeK : this.shadeK;
      p.tint = shadeToward(tint, 0x332c22, this.shadeK * 0.5 + Math.random() * 0.15);
      p.state = PState.Free;
      p.age = 0;
      p.settled = 0;
      p.fade = 1;
      p.stickId = -1;
      p.sx = 0;
      p.sy = 0;
      p.dead = false;
      this.particles.push(p);
    }
  }

  /** One 60 Hz step. Colliders are screen-space AABBs supplied by the scene. */
  step(colliders: Collider[]): void {
    const P = this.params;
    const ps = this.particles;
    const byId = new Map<number, Collider>();
    for (const c of colliders) byId.set(c.id, c);

    // --- stuck particles ride their victim and drip downwards ---
    for (const p of ps) {
      if (p.state !== PState.Stuck) continue;
      const c = byId.get(p.stickId);
      if (!c) {
        this.unstick(p);
        continue;
      }
      // heavier drops slide faster, so a splat streaks apart as it runs down
      const nsy = p.sy + P.dripSlide * (p.r / 3.5);
      const nx = c.x + p.sx;
      const ny = c.y + nsy;
      if (c.mask && !maskSolid(c, nx, ny)) {
        // slid past the silhouette's lower edge (chin, hem, fingertip) — or the
        // reaction frame moved the body out from under it — fall as a drip
        this.unstick(p);
        p.x = nx;
        p.y = ny;
        p.vx = c.vx;
        p.vy = Math.max(c.vy, 0) + 0.5;
        p.px = p.x - p.vx;
        p.py = p.y - p.vy;
        continue;
      }
      p.sy = nsy;
      p.x = nx;
      p.y = ny;
      p.px = p.x - c.vx;
      p.py = p.y - c.vy;
      if (p.sy > c.hh + 2) {
        // dripped off the bottom edge — become a falling droplet again
        this.unstick(p);
        p.vx = c.vx;
        p.vy = Math.max(c.vy, 0) + 0.5;
      }
      p.age++;
      if (p.age > 60 * 6) p.fade -= 1 / P.fadeFrames;
      if (p.fade <= 0) p.dead = true;
    }

    // --- free particles: forces ---
    for (const p of ps) {
      if (p.state !== PState.Free) continue;
      p.vy += P.gravity;
      // falling drops are entrained by the air rushing past (world scroll)
      p.vx += (-this.worldVx - p.vx) * P.airEntrainX;
    }

    this.buildGrid();
    this.applyViscosity();

    // --- integrate ---
    for (const p of ps) {
      if (p.state !== PState.Free) continue;
      p.px = p.x;
      p.py = p.y;
      p.x += p.vx;
      p.y += p.vy;
    }

    this.doubleDensityRelax();
    this.collide(colliders);

    // --- recover velocities, settle & fade bookkeeping ---
    for (const p of ps) {
      if (p.state !== PState.Free) continue;
      p.vx = p.x - p.px;
      p.vy = p.y - p.py;
      p.age++;

      const onGround = p.y >= this.groundY - p.r - 1;
      const slow = p.vx * p.vx + p.vy * p.vy < 1.2;
      if (onGround && slow) p.settled++;
      if (p.settled > P.settleFrames || p.age > 60 * 8) p.fade -= 1 / P.fadeFrames;
      if (p.fade <= 0 || p.x < -60 || p.x > this.boundsW + 60 || p.y > this.groundY + 40) {
        p.dead = true;
      }
    }

    // --- compact ---
    let w = 0;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      if (p.dead) this.pool.push(p);
      else ps[w++] = p;
    }
    ps.length = w;
  }

  private unstick(p: Particle): void {
    p.state = PState.Free;
    p.stickId = -1;
    p.settled = 0;
  }

  private reapOldest(): void {
    // prefer killing settled puddle bits, then the oldest particle
    let best = -1;
    let bestScore = -1;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const score = p.age + p.settled * 10 + (p.state === PState.Stuck ? 200 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best >= 0) {
      this.pool.push(this.particles[best]);
      this.particles.splice(best, 1);
    }
  }

  // ---------- neighbours ----------

  private cellKey(x: number, y: number): number {
    return ((y >> CELL_SHIFT) + 512) * HASH_W + ((x >> CELL_SHIFT) + 512);
  }

  private buildGrid(): void {
    this.grid.clear();
    const ps = this.particles;
    for (let i = 0; i < ps.length; i++) {
      if (ps[i].state !== PState.Free) continue;
      const key = this.cellKey(ps[i].x | 0, ps[i].y | 0);
      let cell = this.grid.get(key);
      if (!cell) this.grid.set(key, (cell = []));
      cell.push(i);
    }
  }

  /** Visits each free pair (i < j) within radius h. */
  private forEachPair(fn: (a: Particle, b: Particle, dx: number, dy: number, d: number) => void): void {
    const P = this.params;
    const h = P.h;
    const h2 = h * h;
    const ps = this.particles;
    for (const [key, cell] of this.grid) {
      const cx = key % HASH_W;
      const cy = (key - cx) / HASH_W;
      for (let ny = 0; ny <= 1; ny++) {
        for (let nx = ny === 0 ? 0 : -1; nx <= 1; nx++) {
          if (ny === 0 && nx < 0) continue;
          const other = this.grid.get((cy + ny) * HASH_W + (cx + nx));
          if (!other) continue;
          const same = other === cell;
          for (let a = 0; a < cell.length; a++) {
            const i = cell[a];
            const pi = ps[i];
            for (let b = same ? a + 1 : 0; b < other.length; b++) {
              const j = other[b];
              if (same && j <= i) continue;
              const pj = ps[j];
              const dx = pj.x - pi.x;
              const dy = pj.y - pi.y;
              const d2 = dx * dx + dy * dy;
              if (d2 >= h2 || d2 < 1e-6) continue;
              const d = Math.sqrt(d2);
              fn(pi, pj, dx, dy, d);
            }
          }
        }
      }
    }
  }

  private applyViscosity(): void {
    const P = this.params;
    this.forEachPair((a, b, dx, dy, d) => {
      const q = d / P.h;
      const nx = dx / d;
      const ny = dy / d;
      // inward radial velocity
      const u = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (u <= 0) return;
      const I = (1 - q) * (P.viscSigma * u + P.viscBeta * u * u) * 0.5;
      a.vx -= I * nx;
      a.vy -= I * ny;
      b.vx += I * nx;
      b.vy += I * ny;
    });
  }

  private doubleDensityRelax(): void {
    const P = this.params;
    this.buildGrid();

    // pass 1: densities
    const ps = this.particles;
    const rho = new Float32Array(ps.length);
    const rhoNear = new Float32Array(ps.length);
    const idx = new Map<Particle, number>();
    for (let i = 0; i < ps.length; i++) idx.set(ps[i], i);

    this.forEachPair((a, b, _dx, _dy, d) => {
      const q = 1 - d / P.h;
      const q2 = q * q;
      const ia = idx.get(a)!;
      const ib = idx.get(b)!;
      rho[ia] += q2;
      rho[ib] += q2;
      rhoNear[ia] += q2 * q;
      rhoNear[ib] += q2 * q;
    });

    // pass 2: pressure displacements
    this.forEachPair((a, b, dx, dy, d) => {
      const ia = idx.get(a)!;
      const ib = idx.get(b)!;
      const q = 1 - d / P.h;
      const pr =
        P.stiffness * (rho[ia] - P.restDensity + rho[ib] - P.restDensity) * 0.5;
      const prNear = P.nearStiffness * (rhoNear[ia] + rhoNear[ib]) * 0.5;
      const D = (pr * q + prNear * q * q) * 0.5;
      const nx = dx / d;
      const ny = dy / d;
      a.x -= D * nx;
      a.y -= D * ny;
      b.x += D * nx;
      b.y += D * ny;
    });
  }

  // ---------- collisions ----------

  private collide(colliders: Collider[]): void {
    const P = this.params;
    for (const p of this.particles) {
      if (p.state !== PState.Free) continue;

      // ground
      const floor = this.groundY - p.r * 0.5;
      if (p.y > floor) {
        p.y = floor;
        // tangential friction drags puddles along with the scrolling ground
        const groundVx = -this.worldVx;
        p.px = p.x - (groundVx + (p.x - p.px - groundVx) * 0.35);
        // kill most of the bounce, keep a hint of splash
        p.py = p.y + (p.y - p.py) * 0.15;
      }

      // victims
      for (const c of colliders) {
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        if (Math.abs(dx) > c.hw + p.r * 0.5 || Math.abs(dy) > c.hh + p.r * 0.5) continue;
        // narrowphase: inside the box but off the drawn body (over a shoulder,
        // between the legs) — fly straight through
        if (c.mask && !maskSolid(c, p.x, p.y)) continue;
        const vRelX = p.x - p.px - c.vx;
        const vRelY = p.y - p.py - c.vy;
        const impact = Math.hypot(vRelX, vRelY);
        if (c.sticky && impact > P.stickSpeed) {
          p.state = PState.Stuck;
          p.stickId = c.id;
          p.sx = c.mask ? dx : Phaser_clamp(dx, -c.hw, c.hw);
          p.sy = c.mask ? dy : Phaser_clamp(dy, -c.hh, c.hh);
          p.age = 0;
          c.onHit?.(p, impact);
        } else if (c.mask) {
          // slow contact: perch on the silhouette — back out to the first clear
          // texel above, then damp like a ground landing
          const vyOld = p.y - p.py;
          const vxOld = p.x - p.px;
          let lift = 0;
          const maxLift = p.r * 2 + 4;
          while (lift < maxLift && maskSolid(c, p.x, p.y - lift)) lift += 2;
          p.y -= lift;
          p.py = p.y + vyOld * 0.15;
          p.px = p.x - (c.vx + (vxOld - c.vx) * 0.35);
        } else {
          // shallow push-out along the smaller penetration axis
          const penX = c.hw + p.r * 0.5 - Math.abs(dx);
          const penY = c.hh + p.r * 0.5 - Math.abs(dy);
          if (penX < penY) p.x += penX * Math.sign(dx || 1);
          else p.y += penY * Math.sign(dy || 1);
        }
      }
    }
  }
}

function Phaser_clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Mix a 0xRRGGBB colour toward a target by factor k. */
function shadeToward(tint: number, target: number, k: number): number {
  const r = ((tint >> 16) & 0xff) + (((target >> 16) & 0xff) - ((tint >> 16) & 0xff)) * k;
  const g = ((tint >> 8) & 0xff) + (((target >> 8) & 0xff) - ((tint >> 8) & 0xff)) * k;
  const b = (tint & 0xff) + ((target & 0xff) - (tint & 0xff)) * k;
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

/** Is the world-space point on an opaque texel of the collider's sprite? */
function maskSolid(c: Collider, wx: number, wy: number): boolean {
  const m = c.mask!;
  let tx = (wx - c.x) / (c.scaleX ?? 1);
  if (c.flipX) tx = -tx;
  const px = (tx + m.w / 2) | 0;
  const py = ((wy - c.y) / (c.scaleY ?? 1) + m.h / 2) | 0;
  if (px < 0 || py < 0 || px >= m.w || py >= m.h) return false;
  return m.data[py * m.w + px] >= ALPHA_SOLID;
}
