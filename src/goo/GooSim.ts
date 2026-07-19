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
  /** emitted while rainbow mode was active — victims react with joy, not outrage */
  rainbow: boolean;
  /** emitted while the chilli fire jet was active — the scene dresses these with flames */
  fire: boolean;
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
  /** frames of impact adhesion before gravity starts pulling the splat down */
  stickHold: number;
  /** short-lived sideways smear from the impact, in collider-local px/frame */
  surfaceVx: number;
  /** prevents a settled or bouncing drop from reporting the same street landing again */
  groundHit: boolean;
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
  stickHoldFrames: number; // base pause before a fresh splat begins to drip
  dripSlide: number; // px/frame a stuck particle slides down its victim
  surfaceSeek: number; // sideways search distance for following sloped silhouettes
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
  stickHoldFrames: 14,
  dripSlide: 0.28,
  surfaceSeek: 8,
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
  onGroundHit?: (p: Particle, impactSpeed: number) => void;

  private grid = new Map<number, number[]>();
  private pool: Particle[] = [];
  /** aperiodic 0–1 random walk driving shade wander along the emitted stream */
  private shadeK = Math.random();

  /** particles still falling toward a target — neither stuck nor grounded */
  get airborneCount(): number {
    let n = 0;
    for (const p of this.particles) if (p.state === PState.Free && !p.groundHit) n++;
    return n;
  }

  constructor(params: Partial<GooParams> = {}) {
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  emit(
    x: number,
    y: number,
    vx: number,
    vy: number,
    tint: number,
    count = 1,
    rainbow = false,
    pure = rainbow,
    fire = false,
  ): void {
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
      // pure drops (rainbow, fire) keep their hue — marbling toward brown would muddy them
      p.tint = pure ? tint : shadeToward(tint, 0x332c22, this.shadeK * 0.5 + Math.random() * 0.15);
      p.rainbow = rainbow;
      p.fire = fire;
      p.state = PState.Free;
      p.age = 0;
      p.settled = 0;
      p.fade = 1;
      p.stickId = -1;
      p.sx = 0;
      p.sy = 0;
      p.stickHold = 0;
      p.surfaceVx = 0;
      p.groundHit = false;
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
      // A fresh impact clings for a beat and smears sideways. After that,
      // heavier drops slide faster, so a splat streaks apart as it runs down.
      // Searching a few pixels sideways at the next y lets the goo follow a
      // shoulder, bonnet or windscreen instead of dropping off every slope.
      const held = p.age < p.stickHold;
      const nsy = p.sy + (held ? 0 : P.dripSlide * (p.r / 3.5));
      const smear = p.surfaceVx * Math.max(0, 1 - p.age / Math.max(p.stickHold, 1));
      let nsx = p.sx + smear;
      if (c.mask) {
        const supportX = seekMaskSupport(c, nsx, nsy, P.surfaceSeek, p.surfaceVx);
        if (supportX === undefined) {
          const nx = c.x + nsx;
          const ny = c.y + nsy;
          this.unstick(p);
          p.x = nx;
          p.y = ny;
          p.vx = c.vx + p.surfaceVx * 0.35;
          p.vy = Math.max(c.vy, 0) + 0.7;
          p.px = p.x - p.vx;
          p.py = p.y - p.vy;
          continue;
        }
        nsx = supportX;
      }
      const nx = c.x + nsx;
      const ny = c.y + nsy;
      p.sx = nsx;
      p.sy = nsy;
      p.x = nx;
      p.y = ny;
      p.px = p.x - c.vx;
      p.py = p.y - c.vy;
      if (p.sy > c.hh + 2) {
        // dripped off the bottom edge — become a falling droplet again
        this.unstick(p);
        p.vx = c.vx + p.surfaceVx * 0.35;
        p.vy = Math.max(c.vy, 0) + 0.7;
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
    p.stickHold = 0;
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

      // victims
      for (const c of colliders) {
        // Work in the collider's moving frame and sweep from the previous
        // particle position to the current one. Endpoint-only collision lets
        // a fast drop tunnel through thin heads, arms and car roofs.
        const hit = sweepCollider(c, p);
        if (!hit) continue;
        const dx = hit.x;
        const dy = hit.y;
        const vRelX = p.x - p.px - c.vx;
        const vRelY = p.y - p.py - c.vy;
        // Translate the contact to the collider's current position. The goo
        // is now attached to where the moving victim ended this frame.
        p.x = c.x + dx;
        p.y = c.y + dy;
        const impact = Math.hypot(vRelX, vRelY);
        if (c.sticky && impact > P.stickSpeed) {
          p.state = PState.Stuck;
          p.stickId = c.id;
          p.sx = c.mask ? dx : Phaser_clamp(dx, -c.hw, c.hw);
          p.sy = c.mask ? dy : Phaser_clamp(dy, -c.hh, c.hh);
          p.stickHold = P.stickHoldFrames * (0.65 + Math.random() * 0.7);
          p.surfaceVx = Phaser_clamp(vRelX * 0.18 + (Math.random() - 0.5) * 0.8, -1.4, 1.4);
          p.age = 0;
          c.onHit?.(p, impact);
          break;
        } else if (c.mask) {
          // slow contact: perch on the silhouette — back out to the first clear
          // texel above, then damp like a ground landing
          const vyOld = vRelY + c.vy;
          const vxOld = vRelX + c.vx;
          let lift = 0;
          const maxLift = p.r * 2 + 4;
          while (lift < maxLift && maskSolidLocal(c, dx, dy - lift)) lift += 2;
          p.y -= lift;
          p.py = p.y + vyOld * 0.15;
          p.px = p.x - (c.vx + (vxOld - c.vx) * 0.35);
          break;
        } else {
          // shallow push-out along the smaller penetration axis
          const penX = c.hw + p.r * 0.5 - Math.abs(dx);
          const penY = c.hh + p.r * 0.5 - Math.abs(dy);
          if (penX < penY) p.x += penX * Math.sign(dx || 1);
          else p.y += penY * Math.sign(dy || 1);
          break;
        }
      }

      // Resolve the street after foreground objects so a fast drop cannot be
      // snapped to the ground before its swept path checks a car or person's
      // silhouette.
      if (p.state !== PState.Free) continue;
      const floor = this.groundY - p.r * 0.5;
      if (p.y > floor) {
        if (!p.groundHit) {
          p.groundHit = true;
          this.onGroundHit?.(p, Math.hypot(p.x - p.px, p.y - p.py));
        }
        p.y = floor;
        // tangential friction drags puddles along with the scrolling ground
        const groundVx = -this.worldVx;
        p.px = p.x - (groundVx + (p.x - p.px - groundVx) * 0.35);
        // kill most of the bounce, keep a hint of splash
        p.py = p.y + (p.y - p.py) * 0.15;
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

/**
 * First contact along this frame's particle path, measured in the collider's
 * current local coordinates. Both objects may move during the frame.
 */
function sweepCollider(c: Collider, p: Particle): { x: number; y: number } | undefined {
  const fromX = p.px - (c.x - c.vx);
  const fromY = p.py - (c.y - c.vy);
  const toX = p.x - c.x;
  const toY = p.y - c.y;
  const pad = p.r * 0.5;

  // Cheap swept broadphase before sampling an alpha silhouette.
  if (
    Math.max(fromX, toX) < -c.hw - pad ||
    Math.min(fromX, toX) > c.hw + pad ||
    Math.max(fromY, toY) < -c.hh - pad ||
    Math.min(fromY, toY) > c.hh + pad
  ) {
    return undefined;
  }

  const travel = Math.hypot(toX - fromX, toY - fromY);
  // At most ~2 px between mask probes: narrower than the smallest emitted
  // drop, but bounded so an extreme debug velocity cannot explode frame cost.
  const steps = Math.min(32, Math.max(1, Math.ceil(travel / Math.max(1.5, p.r * 0.45))));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = fromX + (toX - fromX) * t;
    const y = fromY + (toY - fromY) * t;
    if (Math.abs(x) > c.hw + pad || Math.abs(y) > c.hh + pad) continue;
    if (!c.mask || maskSolidLocal(c, x, y)) return { x, y };
  }
  return undefined;
}

/** Find nearby opaque sprite at the requested y so a drip can follow a slope. */
function seekMaskSupport(
  c: Collider,
  localX: number,
  localY: number,
  maxSeek: number,
  bias: number,
): number | undefined {
  if (maskSolidLocal(c, localX, localY)) return localX;
  const firstDir = bias < 0 ? -1 : 1;
  for (let d = 1; d <= maxSeek; d++) {
    const first = localX + d * firstDir;
    if (maskSolidLocal(c, first, localY)) return first;
    const second = localX - d * firstDir;
    if (maskSolidLocal(c, second, localY)) return second;
  }
  return undefined;
}

/** Is a collider-local point on an opaque texel of its sprite? */
function maskSolidLocal(c: Collider, localX: number, localY: number): boolean {
  const m = c.mask!;
  let tx = localX / (c.scaleX ?? 1);
  if (c.flipX) tx = -tx;
  const px = (tx + m.w / 2) | 0;
  const py = (localY / (c.scaleY ?? 1) + m.h / 2) | 0;
  if (px < 0 || py < 0 || px >= m.w || py >= m.h) return false;
  return m.data[py * m.w + px] >= ALPHA_SOLID;
}
