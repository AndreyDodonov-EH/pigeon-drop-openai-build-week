import Phaser from 'phaser';
import { GasLayer } from '../gas/GasLayer';
import { GasSim, type GasTarget } from '../gas/GasSim';
import { GooLayer } from '../goo/GooLayer';
import { GooSim, type Collider, type Particle } from '../goo/GooSim';
import { SFX_VOLUME } from '../audio/mix';

const GUANO_TINT = 0xf2ecd4;
const CHILLI_JET_BOOST = 2.6;
const FLAME_TEXTURE = 'flame-dot';

/** Phaser's manager returns a WebAudio/HTML5 sound with mutable runtime controls. */
type AdjustableSound = Phaser.Sound.BaseSound & { volume: number; rate: number };

export interface GuanoEffectsOptions {
  boundsW: number;
  boundsH: number;
  groundY: number;
  worldVx: number;
  gooDepth: number;
  fireDepth: number;
  gasDepth: number;
  onGroundHit: (particle: Particle, impact: number) => void;
}

export interface GuanoStream {
  rate: number;
  wild: boolean;
  x: number;
  y: number;
  sourceVy: number;
  rainbow: boolean;
  fire: boolean;
  gas: boolean;
}

/** Loads the assets owned by the guano, gas, and chilli output effects. */
export function preloadGuanoEffects(scene: Phaser.Scene): void {
  scene.load.audio('sfx-gas-whoosh', [
    'assets/audio/gas-whoosh.ogg',
    'assets/audio/gas-whoosh.mp3',
  ]);
  scene.load.audio('sfx-gas-loop', ['assets/audio/gas-loop.ogg', 'assets/audio/gas-loop.mp3']);
  scene.load.audio('sfx-boom', ['assets/audio/boom.ogg', 'assets/audio/boom.mp3']);
}

/**
 * Owns the bird-output visuals and audio while the scene owns gameplay state.
 * Timers, pressure, input, and collision consequences are deliberately supplied
 * by GameScene so this class remains an effects subsystem rather than a game mode.
 */
export class GuanoEffects {
  private readonly gooSim: GooSim;
  private readonly gooLayer: GooLayer;
  private readonly gasSim: GasSim;
  private readonly gasLayer: GasLayer;
  private readonly fireEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  private readonly fireDepth: number;
  private emitCarry = 0;
  private gasEmitCarry = 0;
  private rainbowHue = 0;
  private gasHeave?: AdjustableSound;
  private gasHeavePlayedThisPress = false;
  private gasLoop?: AdjustableSound;

  constructor(
    private readonly scene: Phaser.Scene,
    options: GuanoEffectsOptions,
  ) {
    this.gooSim = new GooSim();
    this.gooSim.groundY = options.groundY;
    this.gooSim.boundsW = options.boundsW;
    this.gooSim.worldVx = options.worldVx;
    this.gooSim.onGroundHit = options.onGroundHit;
    this.gooLayer = new GooLayer(scene, options.boundsW, options.boundsH, options.gooDepth);

    this.gasSim = new GasSim();
    this.gasSim.boundsW = options.boundsW;
    this.gasSim.worldVx = options.worldVx;
    this.gasLayer = new GasLayer(scene, options.boundsW, options.boundsH, options.gasDepth);
    this.fireDepth = options.fireDepth;

    this.ensureFlameTexture();
    this.fireEmitter = scene.add
      .particles(0, 0, FLAME_TEXTURE, {
        speedX: { min: -20, max: 20 },
        speedY: { min: -110, max: -30 },
        scale: { start: 1.8, end: 0.2 },
        alpha: { start: 0.95, end: 0 },
        lifespan: { min: 250, max: 600 },
        color: [0xfff7cf, 0xffce42, 0xff7a24, 0xb91f24],
        colorEase: 'quad.out',
        quantity: 0,
        emitting: false,
        maxAliveParticles: 300,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(options.fireDepth);
    this.sparkEmitter = scene.add
      .particles(0, 0, FLAME_TEXTURE, {
        speedX: { min: -70, max: 70 },
        speedY: { min: -140, max: 10 },
        gravityY: 280,
        scale: { start: 0.4, end: 0 },
        alpha: { start: 1, end: 0.2 },
        lifespan: { min: 300, max: 750 },
        tint: [0xfff2b0, 0xffce42, 0xff7a24],
        quantity: 0,
        emitting: false,
        maxAliveParticles: 140,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(options.fireDepth);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  get particleCount(): number {
    return this.gooSim.particles.length;
  }

  /** goo still in flight — a hit may yet land */
  get airborneGooCount(): number {
    return this.gooSim.airborneCount;
  }

  get gasParticleCount(): number {
    return this.gasSim.particles.length;
  }

  resetRainbowHue(): void {
    this.rainbowHue = 0;
    this.gasSim.resetRainbowPhase();
  }

  /** A fresh gas pickup re-arms the opening heave even during a held stream. */
  rearmGasHeave(): void {
    this.gasHeavePlayedThisPress = false;
  }

  /** Emit the requested amount while retaining fractional particles across frames. */
  emitStream(stream: GuanoStream): void {
    this.emitCarry += stream.rate;
    const count = Math.floor(this.emitCarry);
    this.emitCarry -= count;
    if (count <= 0) return;

    if (stream.gas) {
      this.startGasStream();
      this.gasEmitCarry += count * 0.32;
      const gasCount = Math.floor(this.gasEmitCarry);
      this.gasEmitCarry -= gasCount;
      if (gasCount > 0)
        this.gasSim.emit(
          stream.x,
          stream.y,
          stream.wild,
          gasCount,
          stream.rainbow,
          stream.fire,
        );
      return;
    }

    if (stream.fire) {
      this.fireEmitter.emitParticleAt(stream.x, stream.y - 16, 3);
      this.sparkEmitter.emitParticleAt(stream.x, stream.y - 10, 1);
    }

    for (let i = 0; i < count; i++) {
      let tint = GUANO_TINT;
      if (stream.rainbow) {
        this.rainbowHue = (this.rainbowHue + 0.035) % 1;
        tint = Phaser.Display.Color.HSVToRGB(this.rainbowHue, 0.75, 1).color;
      } else if (stream.fire) {
        const whiteHot = Math.random() < 0.25;
        tint = Phaser.Display.Color.HSVToRGB(
          0.01 + Math.random() * 0.11,
          whiteHot ? 0.35 : 0.92,
          1,
        ).color;
      }
      const vx = stream.wild ? -0.4 + (Math.random() - 0.5) * 4.5 : -0.4;
      let vy = stream.wild ? 2.5 + Math.random() * 3.5 : stream.sourceVy * 0.35 + 4.2;
      if (stream.fire) vy += CHILLI_JET_BOOST;
      this.gooSim.emit(
        stream.x,
        stream.y,
        vx,
        vy,
        tint,
        1,
        stream.rainbow,
        stream.rainbow || stream.fire,
        stream.fire,
      );
    }
  }

  /** Advances and renders both output simulations. */
  update(f: number, colliders: Collider[], gasTargets: GasTarget[]): void {
    this.gooSim.step(colliders);
    this.gooLayer.render(this.gooSim.particles);
    this.updateFireFx();
    this.gasSim.step(f, gasTargets);
    this.gasLayer.render(this.gasSim.particles);
    this.updateGasFireFx();
  }

  stopGasStream(): void {
    this.gasHeavePlayedThisPress = false;
    const loop = this.gasLoop;
    if (!loop) return;
    this.gasLoop = undefined;
    this.scene.tweens.killTweensOf(loop);
    this.scene.tweens.add({
      targets: loop,
      volume: 0,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => {
        loop.stop();
        loop.destroy();
      },
    });
  }

  private ensureFlameTexture(): void {
    if (this.scene.textures.exists(FLAME_TEXTURE)) return;
    const flame = this.scene.make.graphics({ x: 0, y: 0 }, false);
    for (let radius = 8; radius > 0; radius--) {
      flame.fillStyle(0xffffff, 0.14).fillCircle(8, 8, radius);
    }
    flame.generateTexture(FLAME_TEXTURE, 16, 16);
    flame.destroy();
  }

  /** Dresses live fire goo with bounded, randomly sampled flames and sparks. */
  private updateFireFx(): void {
    const particles = this.gooSim.particles;
    if (particles.length === 0) return;
    for (let i = 0; i < 24; i++) {
      const particle = particles[(Math.random() * particles.length) | 0];
      if (!particle.fire || particle.dead) continue;
      if (Math.random() < 0.7) {
        this.fireEmitter.emitParticleAt(
          particle.x + (Math.random() - 0.5) * 6,
          particle.y - 3,
        );
      }
      if (Math.random() < 0.12) this.sparkEmitter.emitParticleAt(particle.x, particle.y - 2);
    }
  }

  /**
   * The dragon-breath detonation: ignites the whole airborne cloud and dresses
   * the blast point with a flash, a fireball, and an expanding shockwave ring.
   */
  igniteGas(x: number, y: number): void {
    this.gasSim.ignite(x, y);
    this.fireEmitter.explode(70, x, y);
    this.sparkEmitter.explode(32, x, y);

    const flash = this.scene.add
      .circle(x, y, 42, 0xfff2b0, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(this.fireDepth);
    this.scene.tweens.add({
      targets: flash,
      scale: 3.4,
      alpha: 0,
      duration: 190,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });

    const ring = this.scene.add
      .circle(x, y, 30)
      .setStrokeStyle(11, 0xffce42, 0.85)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(this.fireDepth);
    this.scene.tweens.add({
      targets: ring,
      scale: 8.5,
      alpha: 0,
      duration: 480,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  /** Dresses burning gas parcels the same way, spread across each cloud's body. */
  private updateGasFireFx(): void {
    const particles = this.gasSim.particles;
    if (particles.length === 0) return;
    for (let i = 0; i < 10; i++) {
      const particle = particles[(Math.random() * particles.length) | 0];
      if (!particle.fire) continue;
      const spread = particle.radius * 0.6;
      if (Math.random() < 0.55) {
        this.fireEmitter.emitParticleAt(
          particle.x + (Math.random() - 0.5) * spread,
          particle.y + (Math.random() - 0.5) * spread * 0.7,
        );
      }
      if (Math.random() < 0.08) this.sparkEmitter.emitParticleAt(particle.x, particle.y);
    }
  }

  /** Idempotent per frame: opens with one heave, then sustains the sputter bed. */
  private startGasStream(): void {
    if (!this.gasLoop) {
      const loop = this.scene.sound.add('sfx-gas-loop', {
        loop: true,
        volume: 0,
      }) as AdjustableSound;
      loop.play();
      this.gasLoop = loop;
      this.scene.tweens.add({
        targets: loop,
        volume: 0.22 * SFX_VOLUME,
        duration: 130,
        ease: 'Quad.easeIn',
      });
    }
    if (this.gasHeavePlayedThisPress) return;

    if (!this.gasHeave?.isPlaying) {
      this.gasHeave?.destroy();
      const volume = 0.38 * SFX_VOLUME;
      this.gasHeave = this.scene.sound.add('sfx-gas-whoosh') as AdjustableSound;
      this.gasHeave.play({ volume, rate: Phaser.Math.FloatBetween(0.94, 1.05) });
      this.gasHeave.volume = volume;
    }
    this.gasHeavePlayedThisPress = true;
  }

  private destroy(): void {
    if (this.gasLoop) this.scene.tweens.killTweensOf(this.gasLoop);
    this.gasLoop?.stop();
    this.gasLoop?.destroy();
    this.gasHeave?.stop();
    this.gasHeave?.destroy();
    this.gasLoop = undefined;
    this.gasHeave = undefined;
  }
}
