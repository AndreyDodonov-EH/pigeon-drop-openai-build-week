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
  onHit: () => void;
}

const GAS_TINTS = [0x477f35, 0x6ca843, 0x91c957, 0xb7dc78];

export class GasSim {
  readonly particles: GasParticle[] = [];
  worldVx = 2.1;
  boundsW = 960;

  emit(x: number, y: number, wild: boolean, count = 1): void {
    for (let i = 0; i < count; i++) {
      const startRadius = 9 + Math.random() * 5;
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
        tint: GAS_TINTS[(Math.random() * GAS_TINTS.length) | 0],
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.018,
        hitIds: new Set<number>(),
      });
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
      p.vy = p.vy * drag - (0.038 + lifeT * 0.045) * f;
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
        target.onHit();
      }

      if (p.x < -p.radius || p.x > this.boundsW + p.radius || p.y < -p.radius) continue;
      this.particles[write++] = p;
    }
    this.particles.length = write;
  }
}
