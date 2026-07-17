import Phaser from 'phaser';
import { GooSim, type Collider, type Particle } from '../goo/GooSim';
import { GooLayer } from '../goo/GooLayer';
import { getAlphaMask } from '../goo/alphaMask';
import {
  ensureVictimPalettePipeline,
  victimPaletteTint,
  VICTIM_PALETTE_PIPELINE,
} from '../victims/VictimPalettePipeline';
import { buildTextures, W, H, GROUND_Y } from '../world/textures';

const SCROLL = 2.1; // world scroll, px/frame
const GUANO_TINT = 0xf2ecd4;

// ---- UI palette (string form for text, hex for graphics) ----
const COLOR_CREAM = '#f3ead8';
const COLOR_INK = '#1d1f2a'; // outlines/strokes
const COLOR_AMBER = '#ffd34e';
const COLOR_PALE_GOLD = '#fff7bd';
const COLOR_ORANGE = '#ff8a5c'; // outrage lines, blowout
const COLOR_JOY_GREEN = '#7be07b'; // rainbow-delight reaction lines
const COLOR_WATER = '#a8dcf2';
/** red→violet spectrum used by the pickup burst (matches the arc sprite bands) */
const RAINBOW_COLORS = [0xff5b57, 0xff9d3e, 0xffe05c, 0x65cf76, 0x5bc8e8, 0x8f73e8];

// ---- sprite scales ----
const PIGEON_SCALE = 0.38;
const VICTIM_SCALE = 0.58; // pedestrians and cars
const HYDRANT_SCALE = 0.5;
const PICKUP_SCALE = 0.42;

// Curated clothing/paint hues: blue, burgundy, green, violet, orange, teal,
// ochre, and plum. The shared shader receives hue, source variant, and victim
// kind through the sprite tint vertex data.
const VICTIM_PALETTE_HUES = [0.6, 0.97, 0.28, 0.75, 0.07, 0.5, 0.13, 0.88];

// ---- rainbow pickup tuning ----
const RAINBOW_DURATION = 60 * 10; // frames of rainbow goo per pickup
const PICKUP_FIRST_MS = 2500; // first spawn after game start
const PICKUP_MIN_MS = 12000; // respawn window
const PICKUP_MAX_MS = 20000;
/** collection hitbox half-extents around the pigeon */
const PICKUP_GRAB_X = 40;
const PICKUP_GRAB_Y = 38;

interface Victim {
  sprite: Phaser.GameObjects.Sprite;
  collider: Collider;
  kind: 'ped' | 'car';
  variant: number;
  vx: number; // own velocity, px/frame (screen space handled in update)
  hitCooldown: number;
  bobT: number;
  reactTimer: number; // frames left showing the reaction texture
}

// per-variant splat reactions: outraged one-liner + how the sprite acts out
const PED_LINES = ['MY SUIT!', 'EW EW EW!', 'CONSARN IT!'];
// rainbow goo delights instead of disgusts — same characters, opposite mood
const PED_LINES_RAINBOW = ['FABULOUS!', 'SO PRETTY!!', 'HOT DIGGITY!'];
const CAR_LINES = ['HEY!!', 'HONNNK!', 'MY VAN!'];
const CAR_LINES_RAINBOW = ['FREE PAINT JOB!', 'BEEP BEEP JOY!', 'LOVELY!!'];
const REACT_FRAMES = 90;

/** cruise line the pigeon starts on (also the altitude it holds hands-off) */
const START_Y = 150;

interface Hydrant {
  sprite: Phaser.GameObjects.Sprite;
  collider: Collider;
  jetCol: Phaser.GameObjects.TileSprite; // scrolling water-column sprite, grows from the cap
  crown: Phaser.GameObjects.Image; // splash burst sitting atop the column
  warnFx: Phaser.GameObjects.Graphics; // sputter drops during the warn telegraph
  state: 'idle' | 'warn' | 'burst';
  timer: number; // frames until the next state change
  jetH: number; // current jet height, px above the cap
  jetMaxH: number; // this burst's full height
  splashed: boolean; // pigeon already caught by this burst
}

type PickupKind = 'rainbow';

interface Pickup {
  kind: PickupKind;
  sprite: Phaser.GameObjects.Image;
  halo: Phaser.GameObjects.Arc;
  baseY: number;
  phase: number;
}

export class GameScene extends Phaser.Scene {
  private sim!: GooSim;
  private gooLayer!: GooLayer;

  private pigeon!: Phaser.GameObjects.Container;
  private pigeonImg!: Phaser.GameObjects.Image;
  private pigeonShadow!: Phaser.GameObjects.Image;
  private pigeonY = START_Y;
  private pigeonVy = 0;
  private flapPhase = 0;

  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;
  private streetTs!: Phaser.GameObjects.TileSprite;

  private victims: Victim[] = [];
  private hydrants: Hydrant[] = [];
  private pickups: Pickup[] = [];
  private nextColliderId = 1;
  private pedTimer = 0;
  private carTimer = 0;
  private hydrantTimer = 4000;
  private pickupTimer = PICKUP_FIRST_MS;

  /** digestion pressure, 0–100: fills passively, spent by pooping, 100 = blowout */
  private meter = 40;
  private score = 0;
  private combo = 0;
  private comboTimer = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private pickupStatusText!: Phaser.GameObjects.Text;
  private meterFill!: Phaser.GameObjects.Graphics;
  private portrait!: Phaser.GameObjects.Image;
  private portraitKey = 'normal';
  private portraitHold = 0;
  private batteredTimer = 0;
  private relievedTimer = 0;
  private pooping = false;
  /** involuntary dump in progress (runs until the meter empties) */
  private dumpKind: 'none' | 'blowout' | 'scare' = 'none';
  /** ran dry — no firing until digestion rebuilds a little pressure */
  private emptyLock = false;
  private wobbleT = 0;

  private keys!: Record<'up' | 'up2' | 'down' | 'poop' | 'damage', Phaser.Input.Keyboard.Key>;
  private pointerFly = false;
  private pointerPoop = false;
  /** debug override used by screenshot scripts; gameplay uses rainbowTimer */
  private rainbowDebug = false;
  private rainbowTimer = 0;
  private rainbowHue = 0;
  private emitCarry = 0;

  constructor() {
    super('game');
  }

  preload(): void {
    this.load.image('portrait-normal', 'assets/portraits/normal.png');
    this.load.image('portrait-damage', 'assets/portraits/damage.png');
    this.load.image('portrait-strain', 'assets/portraits/strain.png');
    this.load.image('portrait-pleased', 'assets/portraits/pleased.png');
    this.load.image('portrait-panic', 'assets/portraits/panic.png');
    this.load.image('pigeon-f0', 'assets/sprites/pigeon-f0.png');
    this.load.image('pigeon-f1', 'assets/sprites/pigeon-f1.png');
    this.load.image('pigeon-f2', 'assets/sprites/pigeon-f2.png');
    this.load.image('ped-0', 'assets/sprites/ped-0.png');
    this.load.image('ped-1', 'assets/sprites/ped-1.png');
    this.load.image('ped-2', 'assets/sprites/ped-2.png');
    this.load.image('car-0', 'assets/sprites/car-0.png');
    this.load.image('car-1', 'assets/sprites/car-1.png');
    this.load.image('car-2', 'assets/sprites/car-2.png');
    for (let i = 0; i < 3; i++) {
      this.load.image(`ped-${i}-r`, `assets/sprites/ped-${i}-r.png`);
      this.load.image(`ped-${i}-rainbow`, `assets/sprites/ped-${i}-rainbow.png`);
      this.load.image(`car-${i}-r`, `assets/sprites/car-${i}-r.png`);
      this.load.image(`car-${i}-rainbow`, `assets/sprites/car-${i}-rainbow.png`);
    }
    this.load.image('hydrant-0', 'assets/sprites/hydrant-0.png');
    this.load.image('hydrant-1', 'assets/sprites/hydrant-1.png');
    this.load.image('water-col', 'assets/sprites/water-col.png');
    this.load.image('water-crown', 'assets/sprites/water-crown.png');
    this.load.image('pickup-rainbow', 'assets/sprites/pickup-rainbow.png');
  }

  create(): void {
    buildTextures(this);
    ensureVictimPalettePipeline(this);

    this.add.image(0, 0, 'sky').setOrigin(0, 0).setDisplaySize(W, H).setDepth(0);
    this.bgFar = this.add.tileSprite(0, 0, W, H, 'bg-far').setOrigin(0, 0).setDepth(1);
    this.bgNear = this.add.tileSprite(0, 0, W, H, 'bg-near').setOrigin(0, 0).setDepth(2);
    this.streetTs = this.add
      .tileSprite(0, GROUND_Y - 20, W, H - GROUND_Y + 30, 'street')
      .setOrigin(0, 0)
      .setDepth(3);

    this.pigeonShadow = this.add.image(240, GROUND_Y - 6, 'shadow').setDepth(4);

    // victims live at depth 5, goo at 6, pigeon 7, HUD 10+
    this.sim = new GooSim();
    this.sim.groundY = GROUND_Y;
    this.sim.boundsW = W;
    this.sim.worldVx = SCROLL;
    this.gooLayer = new GooLayer(this, W, H, 6);

    this.pigeonImg = this.add.image(0, 0, 'pigeon-f1').setScale(PIGEON_SCALE);
    this.pigeon = this.add.container(240, this.pigeonY, [this.pigeonImg]).setDepth(7);

    this.createHud();
    this.createInput();

    // expose hooks for headless screenshot driving
    (window as unknown as Record<string, unknown>).SP = {
      scene: this,
      setFly: (v: boolean) => (this.pointerFly = v),
      setPoop: (v: boolean) => (this.pointerPoop = v),
      setRainbow: (v: boolean) => (this.rainbowDebug = v),
      particleCount: () => this.sim.particles.length,
      spawnHydrant: () => this.spawnHydrant(),
      spawnRainbowPickup: (x = W + 60, y = this.pigeonY) => this.spawnPickup('rainbow', x, y),
      rainbowRemaining: () => this.rainbowTimer,
      pigeonY: () => this.pigeonY,
    };
  }

  private createHud(): void {
    const px = 64;
    const py = 64;
    this.add.circle(px, py, 46, 0x1d1f2a).setDepth(10).setStrokeStyle(3, 0x0e0f16);
    this.portrait = this.add.image(px, py, 'portrait-normal').setDepth(11).setDisplaySize(88, 88);
    const maskShape = this.make.graphics({}, false);
    maskShape.fillCircle(px, py, 43);
    this.portrait.setMask(maskShape.createGeometryMask());

    // pressure gauge: a ring around the portrait that fills clockwise from the
    // top as digestion builds — the face literally sits inside its own meter
    this.meterFill = this.add.graphics().setDepth(10);

    this.scoreText = this.add
      .text(W - 24, 18, '0', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '34px',
        color: COLOR_CREAM,
        stroke: COLOR_INK,
        strokeThickness: 6,
      })
      .setOrigin(1, 0)
      .setDepth(10);
    this.comboText = this.add
      .text(W - 24, 58, '', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '20px',
        color: COLOR_AMBER,
        stroke: COLOR_INK,
        strokeThickness: 4,
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.pickupStatusText = this.add
      .text(W / 2, 20, '', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '18px',
        color: COLOR_PALE_GOLD,
        stroke: COLOR_INK,
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    this.add
      .text(16, H - 26, 'HOLD ↑ / SPACE / LMB — climb     HOLD ↓ — dive     HOLD S / RMB — let it rip', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: COLOR_CREAM,
      })
      .setDepth(10)
      .setAlpha(0.75);
  }

  private createInput(): void {
    const kb = this.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      up2: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      poop: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      damage: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) this.pointerPoop = true;
      else this.pointerFly = true;
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!p.rightButtonDown()) this.pointerFly = false;
      this.pointerPoop = false;
    });
  }

  update(_time: number, deltaMs: number): void {
    // normalize to 60 Hz frame units used by the sim
    const f = Math.min(deltaMs / (1000 / 60), 2);

    this.scrollWorld(f);
    this.updatePigeon(f);
    this.updatePickups(f, deltaMs);
    this.updateVictims(f, deltaMs);
    this.updateHydrants(f, deltaMs);
    this.updateGuano(f);
    this.updateHud(f);
  }

  private scrollWorld(f: number): void {
    this.bgFar.tilePositionX += SCROLL * 0.25 * f;
    this.bgNear.tilePositionX += SCROLL * 0.55 * f;
    this.streetTs.tilePositionX += SCROLL * f;
  }

  private updatePigeon(f: number): void {
    const up = this.keys.up.isDown || this.keys.up2.isDown || this.pointerFly;
    const down = this.keys.down.isDown;
    // it's a bird, not a brick: velocity trims toward an input-chosen target,
    // so releasing everything levels off and holds the current altitude
    const targetVy = up ? -3.6 : down ? 4.2 : 0;
    this.pigeonVy += (targetVy - this.pigeonVy) * 0.09 * f;
    this.pigeonY = Phaser.Math.Clamp(this.pigeonY + this.pigeonVy * f, 56, GROUND_Y - 90);
    if (this.pigeonY <= 56 || this.pigeonY >= GROUND_Y - 90) this.pigeonVy = 0;

    // wing flap: fast while climbing, steady hover beat, lazy dive glide
    this.flapPhase += (up ? 0.22 : down ? 0.05 : 0.11) * f;
    const flapSeq = [0, 1, 2, 1];
    this.pigeonImg.setTexture(`pigeon-f${flapSeq[Math.floor(this.flapPhase) % 4]}`);

    // blowout telegraph: wobbly flight ramping up as the meter tops out
    const wobbleAmp =
      this.dumpKind === 'blowout' ? 1 : this.meter >= 92 ? (this.meter - 92) / 8 : 0;
    this.wobbleT += 0.5 * f;
    const wobbleY = Math.sin(this.wobbleT * 2.1) * 5 * wobbleAmp;
    const wobbleRot = Math.sin(this.wobbleT * 3.3) * 0.16 * wobbleAmp;
    // gentle hover bob (visual only) so holding a line doesn't look frozen
    const hoverBob = !up && !down ? Math.sin(this.wobbleT * 0.8) * 2.5 : 0;

    this.pigeon.setY(this.pigeonY + wobbleY + hoverBob);
    this.pigeon.setRotation(
      Phaser.Math.Clamp(this.pigeonVy * 0.06, -0.3, 0.35) + wobbleRot,
    );

    const alt = (GROUND_Y - this.pigeonY) / (GROUND_Y - 56);
    this.pigeonShadow.setScale(1 - alt * 0.55, 1 - alt * 0.4).setAlpha(0.5 - alt * 0.25);
  }

  private spawnPickup(
    kind: PickupKind,
    x = W + 60,
    y = 90 + Math.random() * (GROUND_Y - 210),
  ): void {
    const halo = this.add
      .circle(x, y, 36, 0xffffff, 0.07)
      .setDepth(6.4)
      .setBlendMode(Phaser.BlendModes.ADD);
    const sprite = this.add.image(x, y, `pickup-${kind}`).setScale(PICKUP_SCALE).setDepth(6.5);
    this.pickups.push({ kind, sprite, halo, baseY: y, phase: Math.random() * Math.PI * 2 });
  }

  private updatePickups(f: number, deltaMs: number): void {
    this.pickupTimer -= deltaMs;
    if (this.pickupTimer <= 0) {
      this.spawnPickup('rainbow');
      this.pickupTimer = PICKUP_MIN_MS + Math.random() * (PICKUP_MAX_MS - PICKUP_MIN_MS);
    }

    this.pickups = this.pickups.filter((p) => {
      p.sprite.x -= SCROLL * f;
      p.phase += 0.055 * f;
      p.sprite.y = p.baseY + Math.sin(p.phase) * 9;
      // a rainbow arc hangs in the sky — sway gently instead of coin-spinning
      p.sprite.setAngle(Math.sin(p.phase * 0.8) * 7);
      const pulse = 1 + Math.sin(p.phase * 1.7) * 0.05;
      p.sprite.setScale(PICKUP_SCALE * pulse);
      p.halo
        .setPosition(p.sprite.x, p.sprite.y)
        .setScale(0.9 + Math.sin(p.phase * 1.7) * 0.12)
        .setAlpha(0.45 + Math.sin(p.phase * 1.7) * 0.25);

      const collected =
        Math.abs(p.sprite.x - this.pigeon.x) < PICKUP_GRAB_X &&
        Math.abs(p.sprite.y - this.pigeonY) < PICKUP_GRAB_Y;
      if (collected) {
        this.collectPickup(p.kind, p.sprite.x, p.sprite.y);
        p.sprite.destroy();
        p.halo.destroy();
        return false;
      }
      if (p.sprite.x < -80) {
        p.sprite.destroy();
        p.halo.destroy();
        return false;
      }
      return true;
    });
  }

  private collectPickup(kind: PickupKind, x: number, y: number): void {
    switch (kind) {
      case 'rainbow':
        this.rainbowTimer = RAINBOW_DURATION;
        this.rainbowHue = 0;
        this.popup(x, y - 44, 'RAINBOW GOO!  10s', COLOR_PALE_GOLD, 20);
        this.pickupBurst(x, y);
        break;
    }
  }

  private pickupBurst(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dot = this.add.circle(x, y, 5, RAINBOW_COLORS[i % RAINBOW_COLORS.length]).setDepth(9);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * (45 + (i % 3) * 8),
        y: y + Math.sin(angle) * (45 + (i % 3) * 8),
        scale: 0.2,
        alpha: 0,
        duration: 420,
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }

  private spawnPed(): void {
    const v = (Math.random() * 3) | 0;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const hue = VICTIM_PALETTE_HUES[(Math.random() * VICTIM_PALETTE_HUES.length) | 0];
    const sprite = this.add
      .sprite(W + 40, 0, `ped-${v}`)
      .setScale(VICTIM_SCALE)
      .setDepth(5)
      .setFlipX(dir > 0)
      .setTint(victimPaletteTint(hue, v, 'ped'))
      .setPipeline(VICTIM_PALETTE_PIPELINE);
    sprite.setY(GROUND_Y - sprite.displayHeight / 2);
    this.victims.push({
      sprite,
      kind: 'ped',
      variant: v,
      vx: dir * (0.3 + Math.random() * 0.5),
      hitCooldown: 0,
      bobT: Math.random() * 10,
      reactTimer: 0,
      collider: {
        id: this.nextColliderId++,
        x: sprite.x,
        y: sprite.y,
        // full-sprite broadphase; the alpha mask is the narrow test now
        hw: sprite.displayWidth / 2,
        hh: sprite.displayHeight / 2,
        vx: 0,
        vy: 0,
        sticky: true,
        mask: getAlphaMask(this, `ped-${v}`),
        scaleX: sprite.scaleX,
        scaleY: sprite.scaleY,
        flipX: dir > 0,
      },
    });
  }

  private spawnCar(): void {
    const v = (Math.random() * 3) | 0;
    const hue = VICTIM_PALETTE_HUES[(Math.random() * VICTIM_PALETTE_HUES.length) | 0];
    const sprite = this.add
      .sprite(W + 80, 0, `car-${v}`)
      .setScale(VICTIM_SCALE)
      .setDepth(5)
      .setTint(victimPaletteTint(hue, v, 'car'))
      .setPipeline(VICTIM_PALETTE_PIPELINE);
    sprite.setY(GROUND_Y + 32 - sprite.displayHeight / 2);
    this.victims.push({
      sprite,
      kind: 'car',
      variant: v,
      vx: -(1.6 + Math.random() * 1.2),
      hitCooldown: 0,
      bobT: 0,
      reactTimer: 0,
      collider: {
        id: this.nextColliderId++,
        x: sprite.x,
        y: sprite.y,
        hw: sprite.displayWidth / 2,
        hh: sprite.displayHeight / 2,
        vx: 0,
        vy: 0,
        sticky: true,
        mask: getAlphaMask(this, `car-${v}`),
        scaleX: sprite.scaleX,
        scaleY: sprite.scaleY,
      },
    });
  }

  private spawnHydrant(): void {
    const sprite = this.add.sprite(W + 40, 0, 'hydrant-0').setScale(HYDRANT_SCALE).setDepth(5);
    sprite.setY(GROUND_Y - sprite.displayHeight / 2);
    const jetCol = this.add
      .tileSprite(sprite.x, sprite.y, 14, 0, 'water-col')
      .setOrigin(0.5, 1)
      .setDepth(5)
      .setAlpha(0.88)
      .setVisible(false);
    const crown = this.add
      .image(sprite.x, sprite.y, 'water-crown')
      .setOrigin(0.5, 0.72)
      .setDepth(5)
      .setScale(0.4)
      .setVisible(false);
    this.hydrants.push({
      sprite,
      jetCol,
      crown,
      warnFx: this.add.graphics().setDepth(5),
      state: 'idle',
      timer: 90 + Math.random() * 140,
      jetH: 0,
      jetMaxH: 0,
      splashed: false,
      collider: {
        id: this.nextColliderId++,
        x: sprite.x,
        y: sprite.y,
        hw: sprite.displayWidth / 2,
        hh: sprite.displayHeight / 2,
        vx: 0,
        vy: 0,
        sticky: true,
        mask: getAlphaMask(this, 'hydrant-0'),
        scaleX: sprite.scaleX,
        scaleY: sprite.scaleY,
      },
    });
  }

  private updateHydrants(f: number, deltaMs: number): void {
    this.hydrantTimer -= deltaMs;
    if (this.hydrantTimer <= 0) {
      this.spawnHydrant();
      this.hydrantTimer = 9000 + Math.random() * 8000;
    }

    for (const h of this.hydrants) {
      h.sprite.x -= SCROLL * f;
      // hydrants sit on the ground; the open neck is a fixed height above it
      // (both textures share one padded canvas, so a swap never shifts the base)
      const capY = GROUND_Y - 46;

      h.timer -= f;
      // guaranteed threat: instead of a random idle cycle (which let hydrants
      // drift across without ever erupting), each hydrant bursts exactly once,
      // triggered when the scroll brings it to a fixed distance ahead of the
      // pigeon — warn (65f ≈ 137px of travel) + burst (130f ≈ 273px) then span
      // the pigeon's x, so the column always crosses the flight line at height
      if (h.state === 'idle' && !h.splashed && h.sprite.x <= this.pigeon.x + 230) {
        h.state = 'warn';
        h.timer = 65;
        h.sprite.setTexture('hydrant-1');
      } else if (h.state === 'warn' && h.timer <= 0) {
        h.state = 'burst';
        h.timer = 130;
        // always tall enough to reach the default cruise line (forces a climb
        // to dodge) but never so tall the ceiling clamp can't out-climb it
        h.jetMaxH = 280 + Math.random() * 70;
      } else if (h.state === 'burst' && h.timer <= 0) {
        h.state = 'idle';
        h.splashed = true; // burst spent — never re-arm
        h.sprite.setTexture('hydrant-0');
      }

      // jet grows fast on burst, collapses when the cap reseats
      const targetH = h.state === 'burst' ? h.jetMaxH : 0;
      h.jetH += (targetH - h.jetH) * 0.16 * f;

      // warn telegraph: the cap rattles
      h.sprite.setAngle(h.state === 'warn' ? Math.sin(h.timer * 1.7) * 4 : 0);

      this.updateJetVisual(h, capY, f);

      // the jet is the hazard: fly into the column and get blasted
      if (h.state === 'burst' && !h.splashed && h.jetH > 30) {
        const inX = Math.abs(this.pigeon.x - h.sprite.x) < 30;
        const inY = this.pigeonY + 22 > capY - h.jetH;
        if (inX && inY) {
          h.splashed = true;
          this.scarePoop();
          this.pigeonVy = -5.5; // geyser kick
          this.popup(this.pigeon.x, this.pigeonY - 52, 'SPLOOSH!!', COLOR_WATER, 22);
        }
      }

      h.collider.x = h.sprite.x;
      h.collider.y = h.sprite.y;
      h.collider.vx = -SCROLL * f;
      h.collider.mask = getAlphaMask(this, h.sprite.texture.key);
    }

    this.hydrants = this.hydrants.filter((h) => {
      if (h.sprite.x < -160) {
        h.sprite.destroy();
        h.jetCol.destroy();
        h.crown.destroy();
        h.warnFx.destroy();
        return false;
      }
      return true;
    });
  }

  /** Water column: scrolling sprite tile stretched to jetH, capped by a splash-crown sprite; sputter drops while warning. */
  private updateJetVisual(h: Hydrant, capY: number, f: number): void {
    const x = h.sprite.x;
    const t = this.time.now * 0.02;

    h.warnFx.clear();
    if (h.state === 'warn') {
      h.warnFx.fillStyle(0xa8dcf2, 0.9);
      for (let i = 0; i < 3; i++) {
        const ph = t * 1.3 + i * 2.1;
        h.warnFx.fillCircle(x + Math.sin(ph) * 8, capY - 6 - (ph % 1.7) * 14, 2.5);
      }
    }

    if (h.jetH < 6) {
      h.jetCol.setVisible(false);
      h.crown.setVisible(false);
      return;
    }

    // scrolling flow: the tile's texture slides upward through a box that
    // grows/shrinks with jetH, so height changes never distort the water.
    // WebGL pads TileSprite textures to power-of-two dimensions. Scale by
    // that padded width, not the source PNG width, or the render box clips
    // the right side of the water texture before it reaches the crown.
    const jetW = 14 * (1 + Math.sin(t * 2.4) * 0.06);
    const jetScale = jetW / h.jetCol.potWidth;
    h.jetCol.tilePositionY -= (1.4 / jetScale) * f;
    h.jetCol
      .setPosition(x, capY)
      .setSize(jetW, h.jetH)
      .setTileScale(jetScale)
      .setVisible(true);

    // crown rides the jet top, swelling in as the burst reaches full height
    // and collapsing back down with it
    const growth = Phaser.Math.Clamp(h.jetH / 40, 0, 1);
    h.crown
      .setPosition(x, capY - h.jetH)
      .setScale(0.34 * growth + 0.1, (0.34 * growth + 0.1) * (1 + Math.sin(t * 3) * 0.05))
      .setAlpha(0.85 + Math.sin(t * 2.6) * 0.1)
      .setVisible(true);
  }

  private updateVictims(f: number, deltaMs: number): void {
    this.pedTimer -= deltaMs;
    this.carTimer -= deltaMs;
    if (this.pedTimer <= 0) {
      this.spawnPed();
      this.pedTimer = 900 + Math.random() * 1600;
    }
    if (this.carTimer <= 0) {
      this.spawnCar();
      this.carTimer = 2600 + Math.random() * 3500;
    }

    for (const v of this.victims) {
      const screenVx = v.vx - SCROLL;
      v.sprite.x += screenVx * f;
      if (v.reactTimer > 0) {
        v.reactTimer -= f;
        if (v.reactTimer <= 0) v.sprite.setTexture(`${v.kind}-${v.variant}`);
      }
      if (v.kind === 'ped') {
        v.bobT += 0.25 * f;
        v.sprite.y = GROUND_Y - v.sprite.displayHeight / 2 + Math.abs(Math.sin(v.bobT)) * -3;
      } else {
        v.sprite.y = GROUND_Y + 32 - v.sprite.displayHeight / 2;
      }
      v.collider.x = v.sprite.x;
      v.collider.y = v.sprite.y;
      v.collider.vx = screenVx * f;
      v.collider.vy = 0;
      // track the displayed frame: a reaction-frame swap moves the silhouette,
      // so goo left hanging over a swung arm shakes loose on its own
      v.collider.mask = getAlphaMask(this, v.sprite.texture.key);
      v.hitCooldown -= f;
      v.collider.onHit = (p: Particle, impact: number) => this.onSplat(v, p, impact);
    }

    this.victims = this.victims.filter((v) => {
      if (v.sprite.x < -160) {
        v.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  private onSplat(v: Victim, p: Particle, _impact: number): void {
    if (v.hitCooldown > 0) return;
    v.hitCooldown = 30;

    this.comboTimer = 120;
    this.combo = Math.min(this.combo + 1, 8);
    const base = v.kind === 'car' ? 25 : 10;
    const pts = base * this.combo;
    this.score += pts;

    // rainbow goo flips the mood: victims get a delighted frame + positive line
    const joyful = p.rainbow;

    const label = v.kind === 'car' ? 'DING!' : ['SPLAT!', 'GOTCHA!', 'BULLSEYE!'][(Math.random() * 3) | 0];
    this.popup(v.sprite.x, v.sprite.y - 46, `${label} +${pts}`);

    // reaction frame (outraged or delighted), reverted by updateVictims after REACT_FRAMES
    v.sprite.setTexture(`${v.kind}-${v.variant}${joyful ? '-rainbow' : '-r'}`);
    v.reactTimer = REACT_FRAMES;

    if (v.kind === 'ped') {
      // jogger shudders, the others shake fist/cane (y is owned by the bob update — don't tween it)
      const wiggle = v.variant === 1 ? 5 : 9;
      this.tweens.add({
        targets: v.sprite,
        angle: { from: -wiggle, to: wiggle },
        duration: 80,
        yoyo: true,
        repeat: 3,
        onComplete: () => v.sprite.setAngle(0),
      });
      const line = joyful ? PED_LINES_RAINBOW[v.variant] : PED_LINES[v.variant];
      this.popup(v.sprite.x + 18, v.sprite.y - 70, line, joyful ? COLOR_JOY_GREEN : COLOR_ORANGE, 15);
    } else {
      // suspension dip; the van wobbles twice (a happy car bounces once more)
      this.tweens.add({
        targets: v.sprite,
        scaleY: v.sprite.scaleY * 0.9,
        duration: 70,
        yoyo: true,
        repeat: (v.variant === 2 ? 2 : 0) + (joyful ? 1 : 0),
      });
      const line = joyful ? CAR_LINES_RAINBOW[v.variant] : CAR_LINES[v.variant];
      this.popup(v.sprite.x - 30, v.sprite.y - 40, line, joyful ? COLOR_JOY_GREEN : COLOR_AMBER, 15);
    }
  }

  private popup(x: number, y: number, msg: string, color = COLOR_CREAM, size = 19): void {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: `${size}px`,
        color,
        stroke: COLOR_INK,
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(9);
    this.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 900,
      ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  private updateGuano(f: number): void {
    this.rainbowTimer = Math.max(0, this.rainbowTimer - f);
    if (Phaser.Input.Keyboard.JustDown(this.keys.damage)) this.scarePoop();

    // passive digestion tick (food pickups will add the big jumps later)
    this.meter = Math.min(100, this.meter + 0.12 * f);
    if (this.meter >= 8) this.emptyLock = false;

    // full = involuntary blowout: one huge uncontrolled blast until empty
    if (this.meter >= 100 && this.dumpKind === 'none') {
      this.dumpKind = 'blowout';
      this.popup(this.pigeon.x, this.pigeonY - 52, 'BLOWOUT!!', COLOR_ORANGE, 22);
      this.cameras.main.shake(160, 0.003);
    }

    const wasPooping = this.pooping;
    this.pooping =
      this.dumpKind === 'none' &&
      !this.emptyLock &&
      (this.keys.poop.isDown || this.pointerPoop) &&
      this.meter > 0;
    if (wasPooping && !this.pooping) this.relievedTimer = 60;

    if (this.dumpKind !== 'none') {
      this.meter = Math.max(0, this.meter - 2.4 * f);
      this.emitStream(4 * f, true);
      if (this.meter <= 0) {
        this.dumpKind = 'none';
        this.emptyLock = true;
        this.relievedTimer = 70;
      }
    } else if (this.pooping) {
      // spend what's actually left and scale the stream to it, so the last
      // frame can't fire a full burst off a near-empty tank
      const spend = Math.min(0.45 * f, this.meter);
      this.meter -= spend;
      this.emitStream(1.6 * f * (spend / (0.45 * f)), false);
      if (this.meter <= 0) this.emptyLock = true;
    }

    this.sim.step([
      ...this.victims.map((v) => v.collider),
      ...this.hydrants.map((h) => h.collider),
    ]);
    this.gooLayer.render(this.sim.particles);
  }

  /** Emit `rate` drops this frame; `wild` sprays uncontrolled instead of streaming. */
  private emitStream(rate: number, wild: boolean): void {
    this.emitCarry += rate;
    const n = Math.floor(this.emitCarry);
    this.emitCarry -= n;
    if (n <= 0) return;
    const rainbow = this.rainbowDebug || this.rainbowTimer > 0;
    // emit from under the tail, inheriting a bit of the pigeon's motion
    const tailX = this.pigeon.x - 42;
    const tailY = this.pigeonY + 24;
    for (let i = 0; i < n; i++) {
      let tint = GUANO_TINT;
      if (rainbow) {
        // advance per drop, not per frame, so even a short burst spans the spectrum
        this.rainbowHue = (this.rainbowHue + 0.035) % 1;
        tint = Phaser.Display.Color.HSVToRGB(this.rainbowHue, 0.75, 1).color;
      }
      const vx = wild ? -0.4 + (Math.random() - 0.5) * 4.5 : -0.4;
      const vy = wild ? 2.5 + Math.random() * 3.5 : this.pigeonVy * 0.35 + 4.2;
      this.sim.emit(tailX, tailY, vx, vy, tint, 1, rainbow);
    }
  }

  /**
   * Hazard hit — replaces damage/health entirely: an involuntary full dump.
   * The punishment is wasted pressure and a broken combo, never survival.
   */
  private scarePoop(): void {
    if (this.dumpKind === 'scare') return;
    this.dumpKind = this.meter > 0 ? 'scare' : 'none';
    this.batteredTimer = 90;
    this.cameras.main.shake(120, 0.004);
    this.combo = 0;
  }

  /**
   * Portrait is a pure function of state, strict priority battered → panic →
   * strain → pleased → normal. Escalations switch instantly; de-escalations
   * wait out a minimum hold so competing states can't flicker frame-by-frame.
   */
  private desiredPortrait(): string {
    if (this.batteredTimer > 0) return 'damage';
    if (this.dumpKind === 'blowout' || this.meter >= 92) return 'panic';
    if (this.pooping || this.dumpKind === 'scare' || this.meter > 85) return 'strain';
    if (this.relievedTimer > 0) return 'pleased';
    return 'normal';
  }

  private updateHud(f: number): void {
    this.comboTimer -= f;
    if (this.comboTimer <= 0) this.combo = 0;
    this.batteredTimer -= f;
    this.relievedTimer -= f;
    this.portraitHold -= f;

    const RANK: Record<string, number> = { normal: 0, pleased: 1, strain: 2, panic: 3, damage: 4 };
    const want = this.desiredPortrait();
    if (want !== this.portraitKey && (RANK[want] > RANK[this.portraitKey] || this.portraitHold <= 0)) {
      this.portraitKey = want;
      this.portraitHold = 18;
      this.portrait.setTexture(`portrait-${want}`).setDisplaySize(88, 88);
    }
    // effort states puff the face slightly
    const puff = this.portraitKey === 'strain' || this.portraitKey === 'panic' ? 1.06 : 1;
    this.portrait.setScale((88 / this.portrait.width) * puff);

    this.scoreText.setText(String(this.score));
    this.comboText.setText(this.combo > 1 ? `x${this.combo} COMBO` : '');
    this.pickupStatusText.setText(
      this.rainbowTimer > 0 ? `RAINBOW GOO  ${Math.ceil(this.rainbowTimer / 60)}s` : '',
    );

    // pressure ring: fills clockwise from 12 o'clock, goes amber then pulsing
    // red as the blowout approaches
    const g = this.meterFill;
    g.clear();
    g.lineStyle(9, 0x0e0f16, 1);
    g.beginPath();
    g.arc(64, 64, 53, 0, Math.PI * 2);
    g.strokePath();
    const frac = this.meter / 100;
    if (frac > 0.01) {
      let color = 0xf2ecd4;
      if (frac >= 0.88) {
        // pulse between orange and red
        const pulse = 0.5 + 0.5 * Math.sin(this.time.now * 0.02);
        const gc = Math.round(0x8a + (0x4d - 0x8a) * pulse);
        const bc = Math.round(0x5c + (0x4d - 0x5c) * pulse);
        color = (0xff << 16) | (gc << 8) | bc;
      } else if (frac >= 0.7) {
        color = 0xffd34e;
      }
      g.lineStyle(6, color, 1);
      g.beginPath();
      g.arc(64, 64, 53, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      g.strokePath();
    }
  }
}
