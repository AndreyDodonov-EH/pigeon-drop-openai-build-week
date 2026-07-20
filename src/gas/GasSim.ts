/**
 * Lightweight gas-cloud simulation.
 *
 * Unlike the incompressible guano sim, gas parcels expand, lose density,
 * become buoyant, and are pushed into the world's leftward slipstream. A
 * slowly changing phase gives each parcel turbulent motion without making
 * the cloud flicker randomly from frame to frame.
 */

export interface GasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  startRadius: number;
  radius: number;
  age: number;
  life: number;
  alpha: number;
  tint: number;
  rainbow: boolean;
  fire: boolean;
  phase: number;
  spin: number;
  hitIds: Set<number>;
}

export interface GasTarget {
  id: number;
  x: number;
  y: number;
  hw: number;
  hh: number;
  onHit: (rainbow: boolean, fire: boolean) => void;
}

const GAS_TINTS = [0x477f35, 0x6ca843, 0x91c957, 0xb7dc78];

// S≈0.5, V=1 pastels — full-sat goo hues turn muddy at the gas layer's 0.48 max alpha
const RAINBOW_GAS_TINTS = [
  0xff8080, 0xffbf80, 0xffff80, 0xbfff80, 0x80ff80, 0x80ffbf,
  0x80ffff, 0x80bfff, 0x8080ff, 0xbf80ff, 0xff80ff, 0xff80bf,
];

// same pastel rule as above, walked from ember-yellow down to smoulder-red
const FIRE_GAS_TINTS = [0xffe08a, 0xffb066, 0xff8a5c, 0xf05e4d];

export class GasSim {
  readonly particles: GasParticle[] = [];
  worldVx = 2.1;
  boundsW = 960;
  private rainbowPhase = 0;

  resetRainbowPhase(): void {
    this.rainbowPhase = 0;
  }

  emit(x: number, y: number, wild: boolean, count = 1, rainbow = false, fire = false): void {
    for (let i = 0; i < count; i++) {
      const startRadius = 9 + Math.random() * 5;
      let tint: number;
      if (rainbow) {
        this.rainbowPhase += 0.35;
        tint = RAINBOW_GAS_TINTS[Math.floor(this.rainbowPhase) % RAINBOW_GAS_TINTS.length];
      } else if (fire) {
        tint = FIRE_GAS_TINTS[(Math.random() * FIRE_GAS_TINTS.length) | 0];
      } else {
        tint = GAS_TINTS[(Math.random() * GAS_TINTS.length) | 0];
      }
      this.particles.push({
        x: x + (Math.random() - 0.5) * 9,
        y: y + (Math.random() - 0.5) * 8,
        // A fart starts as a short downward/backward jet, then drag and
        // buoyancy turn it into a rising cloud in the slipstream.
        vx: wild ? -2.5 + (Math.random() - 0.5) * 3.8 : -2.4 - Math.random() * 1.3,
        vy: wild ? 0.1 + Math.random() * 2.5 : 0.55 + Math.random() * 0.8,
        startRadius,
        radius: startRadius,
        age: 0,
        life: 105 + Math.random() * 55,
        alpha: 0,
        tint,
        rainbow,
        fire,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.018,
        hitIds: new Set<number>(),
      });
    }
  }

  /**
   * Detonation: every airborne parcel catches fire and is shoved radially
   * away from the blast point, hardest near the centre. Rainbow parcels burn
   * too — an explosion outranks whimsy.
   *
   * chilli→gas completes with no cloud yet (pea just armed the timer), so seed
   * a fireball when the air is empty — same read as lighting a dumped cloud.
   */
  ignite(x: number, y: number): void {
    if (this.particles.length === 0) this.emit(x, y, true, 16, false, true);
    for (const p of this.particles) {
      p.fire = true;
      p.rainbow = false;
      p.tint = FIRE_GAS_TINTS[(Math.random() * FIRE_GAS_TINTS.length) | 0];
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy) || 1;
      const kick = 150 / (d + 20);
      p.vx += (dx / d) * kick;
      p.vy += (dy / d) * kick;
    }
  }

  step(f: number, targets: GasTarget[]): void {
    let write = 0;
    for (const p of this.particles) {
      p.age += f;
      const lifeT = p.age / p.life;
      if (lifeT >= 1) continue;

      // Air drag pulls parcels toward the scrolling world's velocity. Their
      // own heat/buoyancy increasingly wins vertically as the initial jet dies.
      const drag = Math.pow(0.985, f);
      p.vx = (p.vx + (-this.worldVx * 1.2 - p.vx) * 0.018 * f) * drag;
      // hot parcels are extra buoyant, so dragon breath climbs visibly faster
      p.vy = p.vy * drag - (0.038 + lifeT * 0.045) * (p.fire ? 1.4 : 1) * f;
      p.phase += (0.055 + lifeT * 0.035) * f;
      const turbulence = 0.055 + lifeT * 0.09;
      p.x += (p.vx + Math.sin(p.phase * 1.7) * turbulence) * f;
      p.y += (p.vy + Math.cos(p.phase * 1.23) * turbulence * 0.7) * f;

      // Expansion accelerates slightly as the parcel thins. Alpha eases in,
      // holds briefly, then fades for most of its lifetime like real vapour.
      p.radius = p.startRadius * (1 + lifeT * 2.15 + lifeT * lifeT * 0.55);
      const appear = Math.min(p.age / 7, 1);
      const disappear = Math.min((1 - lifeT) / 0.62, 1);
      p.alpha = appear * disappear * 0.48;

      for (const target of targets) {
        if (p.hitIds.has(target.id)) continue;
        const dx = Math.max(Math.abs(p.x - target.x) - target.hw, 0);
        const dy = Math.max(Math.abs(p.y - target.y) - target.hh, 0);
        const hitRadius = p.radius * 0.72;
        if (dx * dx + dy * dy > hitRadius * hitRadius) continue;
        p.hitIds.add(target.id);
        target.onHit(p.rainbow, p.fire);
      }

      if (p.x < -p.radius || p.x > this.boundsW + p.radius || p.y < -p.radius) continue;
      this.particles[write++] = p;
    }
    this.particles.length = write;
  }
}
