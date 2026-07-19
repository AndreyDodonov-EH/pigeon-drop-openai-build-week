import Phaser from 'phaser';
import type { Collider, Particle } from '../goo/GooSim';
import { getAlphaMask } from '../goo/alphaMask';
import { GuanoEffects, preloadGuanoEffects } from '../effects/GuanoEffects';
import {
  ensureVictimPalettePipeline,
  victimPaletteTint,
  VICTIM_PALETTE_PIPELINE,
} from '../victims/VictimPalettePipeline';
import { buildTextures, W, H, GROUND_Y, SIDEWALK_H } from '../world/textures';
import {
  NearBuildingsLayer,
  BUILDING_SPRITES,
  CONNECTOR_SPRITES,
} from '../world/NearBuildings';
import { ensureBuildingPalettePipeline } from '../world/BuildingPalettePipeline';
import { MusicManager } from '../audio/MusicManager';
import { SFX_VOLUME } from '../audio/mix';
import { TouchControls, isTouchDevice } from '../input/TouchControls';
import { FirstRunWizard, shouldShowWizard } from '../ui/FirstRunWizard';
import { rankForCombo, type ComboRank } from '../ui/ranks';
import { t } from '../i18n';

const SCROLL = 2.1; // world scroll, px/frame

// ---- UI palette (string form for text, hex for graphics) ----
const COLOR_CREAM = '#f3ead8';
const COLOR_INK = '#1d1f2a'; // outlines/strokes
const COLOR_AMBER = '#ffd34e';
const COLOR_ORANGE = '#ff8a5c'; // outrage lines, blowout
const COLOR_JOY_GREEN = '#7be07b'; // rainbow-delight reaction lines
const COLOR_WATER = '#a8dcf2';
/** red→violet spectrum used by the rainbow pickup burst (matches the arc sprite bands) */
const RAINBOW_COLORS = [0xff5b57, 0xff9d3e, 0xffe05c, 0x65cf76, 0x5bc8e8, 0x8f73e8];

// ---- sprite scales ----
const PIGEON_SCALE = 0.38;
const VICTIM_SCALE = 0.58; // pedestrians and cars
const HYDRANT_SCALE = 0.5;
const PICKUP_SCALE = 0.34;
const PED_VARIANT_COUNT = 7;
// The inline skater outruns the world scroll: high-value, high-lead target.
const SKATER_VARIANT = 6;
const SKATER_BASE_SCORE = 40;
/** frames per stride pose before swapping ped-6 <-> ped-6-b (~1/3 s per leg) */
const SKATER_STRIDE_FRAMES = 20;
const PEDESTRIAN_DEPTH = 5;
// street furniture (lamps/trees/mailboxes/hydrants) stands at the curb edge,
// closer to camera than the pedestrians walking against the buildings
const STREET_PROP_DEPTH = 5.05;
const CAR_DEPTH = 5.1; // the road lane is closer to camera than the pavement
// Pedestrians walk on the sidewalk band against the buildings, not on the
// curb: their ground line sits above GROUND_Y (the curb/road line).
const PED_GROUND_Y = GROUND_Y - 9;

// Curated clothing/paint/tie hues: blue, burgundy, green, violet, orange,
// teal, ochre, and plum. The shared shader receives hue, accent hue, source
// variant, and victim kind through the sprite tint vertex data.
const VICTIM_PALETTE_HUES = [0.6, 0.97, 0.28, 0.75, 0.07, 0.5, 0.13, 0.88];
// The runner's hair stays plausible while still adding visible variety.
const RUNNER_HAIR_HUES = [0.03, 0.08, 0.13]; // red, brown, blonde

// ---- pickup tuning ----
const RAINBOW_DURATION = 60 * 10; // frames of rainbow goo per pickup
const RAINBOW_PICKUP_FIRST_MS = 2500;
const RAINBOW_PICKUP_MIN_MS = 12000;
const RAINBOW_PICKUP_MAX_MS = 20000;
const ITEM_PICKUP_FIRST_MS = 4200;
const ITEM_PICKUP_MIN_MS = 5000;
const ITEM_PICKUP_MAX_MS = 9000;
const PEA_LOOK_FRAME_FRAMES = 18;
const PASSIVE_DIGESTION_PER_FRAME = 0.035;
// Ran-dry lockout releases once this much pressure rebuilds. Kept very short
// (~1.3s) — just enough to stop dribble-firing off a refilling tank.
const EMPTY_LOCK_RELEASE = 3;
const COFFEE_DURATION = 60 * 8;
const COFFEE_FILL_MULTIPLIER = 3;
const GAS_DURATION = 60 * 8;
const CHILLI_DURATION = 60 * 8;
const GAS_COLORS = [0x2d7d36, 0x55ad3d, 0x91d852, 0xd5ee83];
// A continuous goo stream lands as one shifting puddle, not a machine-gun row
// of discrete drops. Keep street impacts far enough apart that the short sample
// fully clears and each replay reads as a new landing cluster.
const ASPHALT_SPLAT_COOLDOWN_MS = 420;
/** collection hitbox half-extents around the pigeon */
const PICKUP_GRAB_X = 33;
const PICKUP_GRAB_Y = 30;

const ITEM_PICKUP_KINDS = ['bread', 'fries', 'kebab', 'chilli', 'coffee', 'pea'] as const;
type ItemPickupKind = (typeof ITEM_PICKUP_KINDS)[number];
type PickupKind = 'rainbow' | ItemPickupKind;

interface ItemPickupEffect {
  pressureGain?: number;
  burstColors: number[];
}

const ITEM_PICKUP_EFFECTS: Record<ItemPickupKind, ItemPickupEffect> = {
  bread: {
    pressureGain: 5,
    burstColors: [0x8c4d28, 0xd79649, 0xf1d79b],
  },
  fries: {
    pressureGain: 8,
    burstColors: [0xd93b2f, 0xffa83d, 0xffdb57],
  },
  kebab: {
    pressureGain: 20,
    burstColors: [0x8b4a2b, 0xe74f36, 0x68b94d, 0xf2dfb6, 0x9d3c89],
  },
  chilli: {
    burstColors: [0xb91f24, 0xf03b26, 0xff7a24, 0xffce42],
  },
  coffee: {
    burstColors: [0x4a2719, 0x794225, 0xb96f37, 0xe2a763],
  },
  pea: {
    burstColors: [0x2c7a2f, 0x59ad3b, 0x8bd84c, 0xd6ef82],
  },
};

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
const PED_LINES = [
  'MY SUIT!',
  'EW EW EW!',
  'CONSARN IT!',
  'NOT THE BAG!',
  'MY MAP!',
  'BRO! SERIOUSLY?!',
  'DUDE, MY HOODIE!',
];
// rainbow goo delights instead of disgusts — same characters, opposite mood
const PED_LINES_RAINBOW = [
  'FABULOUS!',
  'SO PRETTY!!',
  'HOT DIGGITY!',
  'CONTENT GOLD!',
  'BEST TRIP EVER!',
  'SICK COLORS!',
  'RADICAL!!',
];
const CAR_LINES = ['HEY!!', 'HONNNK!', 'MY VAN!'];
const CAR_LINES_RAINBOW = ['FREE PAINT JOB!', 'BEEP BEEP JOY!', 'LOVELY!!'];
const REACT_FRAMES = 90;

// Voiced hit reactions stay a garnish, not a soundtrack: only the loud personalities
// vocalize (suit guy, granddad, influencer, gym bro; the van keeps its text line), a coin flip
// thins them further, and one shared cooldown keeps a combo from becoming a chorus.
const VOCAL_PED_VARIANTS = new Set([0, 2, 3, 5]);
const VOCAL_CAR_VARIANTS = new Set([0, 1]);
const VICTIM_VOICE_CHANCE = 0.55;
const VICTIM_VOICE_COOLDOWN_MS = 2500;
/** voice trails the splat so it reads as a reaction, not part of the impact */
const VICTIM_VOICE_DELAY_MS = 150;
// Each vocal ped has its own voice pair (suit guy 0, granddad 2, influencer 3,
// gym bro 5). Street-level voices sit under the splat — they come from far below the
// pigeon — and the per-file scalars also even out loudness differences between masters.
const PED_GRUMBLE_VOLUME: Record<number, number> = { 0: 0.35, 2: 0.45, 3: 0.42, 5: 0.42 };
const PED_DELIGHT_VOLUME: Record<number, number> = { 0: 0.22, 2: 0.32, 3: 0.25, 5: 0.23 };

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
  jetSound?: AdjustableSound;
}

interface Pickup {
  kind: PickupKind;
  sprite: Phaser.GameObjects.Image;
  baseY: number;
  phase: number;
  animT: number;
}

/** Phaser's manager returns a WebAudio/HTML5 sound with mutable volume at runtime. */
type AdjustableSound = Phaser.Sound.BaseSound & { volume: number; rate: number };

type PortraitKey = 'ready' | 'pleased' | 'hungry' | 'strain' | 'panic' | 'damage';

export class GameScene extends Phaser.Scene {
  private guanoFx!: GuanoEffects;

  private pigeon!: Phaser.GameObjects.Container;
  private pigeonImg!: Phaser.GameObjects.Image;
  private pigeonShadow!: Phaser.GameObjects.Image;
  private pigeonY = START_Y;
  private pigeonVy = 0;
  private flapPhase = 0;

  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgNear!: NearBuildingsLayer;
  private sidewalkTs!: Phaser.GameObjects.TileSprite;
  private streetTs!: Phaser.GameObjects.TileSprite;
  private clouds: Phaser.GameObjects.Image[] = [];
  /** decorative sidewalk furniture (lamps/trees/mailboxes), ground-scrolled */
  private props: Phaser.GameObjects.Image[] = [];
  private propTimer = 1200;

  private victims: Victim[] = [];
  private hydrants: Hydrant[] = [];
  private pickups: Pickup[] = [];
  private nextColliderId = 1;
  private pedTimer = 0;
  private carTimer = 0;
  private hydrantTimer = 4000;
  private rainbowPickupTimer = RAINBOW_PICKUP_FIRST_MS;
  private itemPickupTimer = ITEM_PICKUP_FIRST_MS;

  /** digestion pressure, 0–100: fills passively, spent by pooping, 100 = blowout */
  private meter = 40;
  private score = 0;
  private combo = 0;
  private comboTimer = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private rankTier = 0;
  private rankHue = 0;
  /** a goo volley is in the world (firing or still falling), awaiting judgment */
  private salvoActive = false;
  /** something in the current volley touched a victim */
  private salvoHit = false;
  private effectMeters!: Phaser.GameObjects.Graphics;
  private meterArcTex!: Phaser.Textures.CanvasTexture;
  private meterArcKey = '';
  private portrait!: Phaser.GameObjects.Image;
  private portraitKey: PortraitKey = 'ready';
  private portraitHold = 0;
  private batteredTimer = 0;
  private relievedTimer = 0;
  private coffeeTimer = 0;
  private chilliTimer = 0;
  private gasTimer = 0;
  private pooping = false;
  /** involuntary dump in progress (runs until the meter empties) */
  private dumpKind: 'none' | 'blowout' | 'scare' = 'none';
  /** ran dry — no firing until digestion rebuilds a little pressure */
  private emptyLock = false;
  /** throttles the empty-belly-rumble telegraph while poop is held on an empty tank */
  private bellyRumbleCooldown = 0;
  /** poop held but the tank is empty/locked — drives the hungry portrait */
  private squeezingEmpty = false;
  private wobbleT = 0;

  private keys!: Record<'up' | 'up2' | 'down' | 'poop' | 'damage', Phaser.Input.Keyboard.Key>;
  private pointerFly = false;
  private pointerPoop = false;
  private touch!: TouchControls;
  /** debug override used by screenshot scripts; gameplay uses rainbowTimer */
  private rainbowDebug = false;
  private rainbowTimer = 0;
  private nextAsphaltSplatAt = 0;
  private nextVictimVoiceAt = 0;
  private music!: MusicManager;

  constructor() {
    super('game');
  }

  preload(): void {
    preloadGuanoEffects(this);
    this.load.audio('music-sneaky', ['assets/audio/music-sneaky.ogg', 'assets/audio/music-sneaky.mp3']);
    this.load.audio('music-klezmer', ['assets/audio/music-klezmer.ogg', 'assets/audio/music-klezmer.mp3']);
    this.load.audio('sfx-splat-ped', ['assets/audio/splat.ogg', 'assets/audio/splat.mp3']);
    this.load.audio('sfx-splat-car', ['assets/audio/splat-car.ogg', 'assets/audio/splat-car.mp3']);
    this.load.audio('sfx-splat-asphalt', [
      'assets/audio/splat-asphalt.ogg',
      'assets/audio/splat-asphalt.mp3',
    ]);
    this.load.audio('sfx-hydrant-clank', [
      'assets/audio/hydrant-clank.ogg',
      'assets/audio/hydrant-clank.mp3',
    ]);
    this.load.audio('sfx-hydrant-jet-loop', [
      'assets/audio/hydrant-jet-loop.ogg',
      'assets/audio/hydrant-jet-loop.mp3',
    ]);
    this.load.audio('sfx-splash-hydrant', [
      'assets/audio/splash-hydrant.ogg',
      'assets/audio/splash-hydrant.mp3',
    ]);
    this.load.audio('sfx-koo-irritated', [
      'assets/audio/koo-irritated.ogg',
      'assets/audio/koo-irritated.mp3',
    ]);
    this.load.audio('sfx-belly-rumble', [
      'assets/audio/belly-rumble.ogg',
      'assets/audio/belly-rumble.mp3',
    ]);
    for (const i of VOCAL_PED_VARIANTS) {
      this.load.audio(`sfx-ped-grumble-${i}`, [
        `assets/audio/ped-grumble-${i}.ogg`,
        `assets/audio/ped-grumble-${i}.mp3`,
      ]);
      this.load.audio(`sfx-ped-delight-${i}`, [
        `assets/audio/ped-delight-${i}.ogg`,
        `assets/audio/ped-delight-${i}.mp3`,
      ]);
    }
    this.load.audio('sfx-car-honk-angry', [
      'assets/audio/car-honk-angry.ogg',
      'assets/audio/car-honk-angry.mp3',
    ]);
    this.load.audio('sfx-car-honk-happy', [
      'assets/audio/car-honk-happy.ogg',
      'assets/audio/car-honk-happy.mp3',
    ]);
    this.load.image('portrait-ready', 'assets/portraits/ready.png');
    this.load.image('portrait-damage', 'assets/portraits/damage.png');
    this.load.image('portrait-strain', 'assets/portraits/strain.png');
    this.load.image('portrait-pleased', 'assets/portraits/pleased.png');
    this.load.image('portrait-panic', 'assets/portraits/panic.png');
    this.load.image('portrait-hungry', 'assets/portraits/hungry.png');
    this.load.image('pigeon-f0', 'assets/sprites/pigeon-f0.png');
    this.load.image('pigeon-f1', 'assets/sprites/pigeon-f1.png');
    this.load.image('pigeon-f2', 'assets/sprites/pigeon-f2.png');
    this.load.image('car-0', 'assets/sprites/car-0.png');
    this.load.image('car-1', 'assets/sprites/car-1.png');
    this.load.image('car-2', 'assets/sprites/car-2.png');
    for (let i = 0; i < PED_VARIANT_COUNT; i++) {
      this.load.image(`ped-${i}`, `assets/sprites/ped-${i}.png`);
      this.load.image(`ped-${i}-r`, `assets/sprites/ped-${i}-r.png`);
      this.load.image(`ped-${i}-rainbow`, `assets/sprites/ped-${i}-rainbow.png`);
    }
    // second stride pose; the skater alternates legs instead of bobbing
    this.load.image(`ped-${SKATER_VARIANT}-b`, `assets/sprites/ped-${SKATER_VARIANT}-b.png`);
    for (let i = 0; i < 3; i++) {
      this.load.image(`car-${i}-r`, `assets/sprites/car-${i}-r.png`);
      this.load.image(`car-${i}-rainbow`, `assets/sprites/car-${i}-rainbow.png`);
    }
    for (const key of [...BUILDING_SPRITES, ...CONNECTOR_SPRITES]) {
      this.load.image(key, `assets/sprites/${key}.png`);
    }
    for (let i = 0; i < 3; i++) {
      this.load.image(`bg-cloud-${i}`, `assets/sprites/bg-cloud-${i}.png`);
    }
    this.load.image('bg-lamp', 'assets/sprites/bg-lamp.png');
    this.load.image('bg-tree', 'assets/sprites/bg-tree.png');
    this.load.image('bg-mailbox', 'assets/sprites/bg-mailbox.png');
    this.load.image('hydrant-0', 'assets/sprites/hydrant-0.png');
    this.load.image('hydrant-1', 'assets/sprites/hydrant-1.png');
    this.load.image('water-col', 'assets/sprites/water-col.png');
    this.load.image('water-crown', 'assets/sprites/water-crown.png');
    this.load.image('pickup-rainbow', 'assets/sprites/pickup-rainbow.png');
    for (const kind of ITEM_PICKUP_KINDS) {
      if (kind === 'pea') {
        this.load.image('pickup-pea-0', 'assets/sprites/pickup-pea-0.png');
        this.load.image('pickup-pea-1', 'assets/sprites/pickup-pea-1.png');
      } else {
        this.load.image(`pickup-${kind}`, `assets/sprites/pickup-${kind}.png`);
      }
    }
  }

  create(): void {
    buildTextures(this);
    ensureVictimPalettePipeline(this);
    ensureBuildingPalettePipeline(this);

    this.add.image(0, 0, 'sky').setOrigin(0, 0).setDisplaySize(W, H).setDepth(0);
    // clouds live between the sky and the far skyline, each with its own drift
    for (let i = 0; i < 5; i++) {
      const cloud = this.add
        .image(Math.random() * W, 36 + Math.random() * 150, `bg-cloud-${i % 3}`)
        .setDepth(0.5)
        .setAlpha(0.7 + Math.random() * 0.2)
        .setScale(0.45 + Math.random() * 0.6);
      cloud.setData('drift', 0.1 + Math.random() * 0.12);
      this.clouds.push(cloud);
    }
    this.bgFar = this.add.tileSprite(0, 0, W, H, 'bg-far').setOrigin(0, 0).setDepth(1);
    // pavement behind the facades, scrolling with them so stoops stay planted
    this.sidewalkTs = this.add
      .tileSprite(0, GROUND_Y - 6 - SIDEWALK_H, W, SIDEWALK_H, 'sidewalk')
      .setOrigin(0, 0)
      .setDepth(1.5);
    this.bgNear = new NearBuildingsLayer(this, 2);
    this.streetTs = this.add
      .tileSprite(0, GROUND_Y - 6, W, H - GROUND_Y + 6, 'street')
      .setOrigin(0, 0)
      .setDepth(3);

    this.pigeonShadow = this.add.image(240, GROUND_Y - 6, 'shadow').setDepth(4);

    // The scene chooses world placement/depth and handles gameplay outcomes;
    // the subsystem owns simulation, rendering, emission, and effect audio.
    this.guanoFx = new GuanoEffects(this, {
      boundsW: W,
      boundsH: H,
      groundY: GROUND_Y,
      worldVx: SCROLL,
      gooDepth: 6,
      fireDepth: 6.5,
      gasDepth: 6.6,
      onGroundHit: (particle, impact) => this.onAsphaltSplat(particle, impact),
    });

    this.pigeonImg = this.add.image(0, 0, 'pigeon-f1').setScale(PIGEON_SCALE);
    this.pigeon = this.add.container(240, this.pigeonY, [this.pigeonImg]).setDepth(7);

    this.createHud();
    this.createInput();
    this.createDebugMenu();
    if (shouldShowWizard()) new FirstRunWizard(this);
    this.music = new MusicManager(this);
    this.music.start();

    // expose hooks for headless screenshot driving
    (window as unknown as Record<string, unknown>).SP = {
      scene: this,
      setFly: (v: boolean) => (this.pointerFly = v),
      setPoop: (v: boolean) => (this.pointerPoop = v),
      setRainbow: (v: boolean) => (this.rainbowDebug = v),
      particleCount: () => this.guanoFx.particleCount,
      gasParticleCount: () => this.guanoFx.gasParticleCount,
      spawnHydrant: () => this.spawnHydrant(),
      spawnRainbowPickup: (x = W + 60, y = this.pigeonY) => this.spawnPickup('rainbow', x, y),
      spawnItemPickup: (
        kind: ItemPickupKind = ITEM_PICKUP_KINDS[0],
        x = W + 60,
        y = this.pigeonY,
      ) => this.spawnPickup(kind, x, y),
      rainbowRemaining: () => this.rainbowTimer,
      coffeeRemaining: () => this.coffeeTimer,
      chilliRemaining: () => this.chilliTimer,
      gasRemaining: () => this.gasTimer,
      pigeonY: () => this.pigeonY,
      setCombo: (v: number) => {
        this.combo = v;
        this.comboTimer = 120;
      },
      musicFrantic: () => this.music.franticNow,
      comboRank: () => this.rankTier,
      touchState: () => ({ fly: this.touch.fly, dive: this.touch.dive, poop: this.touch.poop }),
    };
  }

  /** restyle the HUD counter for a new rank tier */
  private applyRank(rank: ComboRank): void {
    const up = rank.tier > this.rankTier;
    this.rankTier = rank.tier;

    this.comboText.setFontSize(rank.fontSize).setColor(rank.color);
    if (!rank.rainbow) this.comboText.clearTint();

    if (up) {
      this.tweens.killTweensOf(this.comboText);
      this.comboText.setScale(1.45);
      this.tweens.add({ targets: this.comboText, scale: 1, duration: 260, ease: 'Back.easeOut' });
      if (rank.name) this.announceRank(rank);
      if (rank.shakeOnEnter) this.cameras.main.shake(160, 0.003);
    }
  }

  /** one-shot rank word: punch in, hold a beat, rise and fade */
  private announceRank(rank: ComboRank): void {
    const txt = this.add
      .text(W / 2, 175, rank.name, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '40px',
        color: rank.color,
        stroke: COLOR_INK,
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(15)
      .setAlpha(0.95)
      .setScale(1.7);
    this.tweens.add({ targets: txt, scale: 1, duration: 150, ease: 'Back.easeOut' });
    if (rank.rainbow) {
      // white fill × hue tint = full-color cycling for the word's whole lifetime
      this.tweens.addCounter({
        from: 0,
        to: 3,
        duration: 900,
        onUpdate: (tw) =>
          txt.setTint(Phaser.Display.Color.HSVToRGB((tw.getValue() ?? 0) % 1, 0.75, 1).color),
      });
    }
    this.tweens.add({
      targets: txt,
      alpha: 0,
      y: 145,
      delay: 450,
      duration: 450,
      ease: 'Quad.easeIn',
      onComplete: () => txt.destroy(),
    });
  }

  private createHud(): void {
    const px = 64;
    const py = 64;
    // WebGL circles/geometry masks alias badly at 960x540, so all the round
    // HUD pieces are drawn into 2x-supersampled canvas textures instead
    const SS = 2;
    const plateSize = 120;
    const c = (plateSize / 2) * SS;
    const plate = this.textures.createCanvas('hud-plate', plateSize * SS, plateSize * SS)!;
    const pctx = plate.context;
    pctx.strokeStyle = '#0e0f16';
    pctx.lineWidth = 9 * SS;
    pctx.beginPath();
    pctx.arc(c, c, 53 * SS, 0, Math.PI * 2);
    pctx.stroke();
    pctx.fillStyle = '#1d1f2a';
    pctx.beginPath();
    pctx.arc(c, c, 46 * SS, 0, Math.PI * 2);
    pctx.fill();
    pctx.lineWidth = 3 * SS;
    pctx.beginPath();
    pctx.arc(c, c, 46 * SS, 0, Math.PI * 2);
    pctx.stroke();
    plate.refresh();
    this.add.image(px, py, 'hud-plate').setDepth(10).setDisplaySize(plateSize, plateSize);

    // portraits get their circular crop baked into canvas textures so the
    // edge is antialiased (a geometry mask would give a hard stencil edge)
    const portraitSize = 88 * SS;
    for (const key of ['ready', 'pleased', 'hungry', 'strain', 'panic', 'damage'] as PortraitKey[]) {
      const tex = this.textures.createCanvas(`portrait-round-${key}`, portraitSize, portraitSize)!;
      const ctx = tex.context;
      ctx.save();
      ctx.beginPath();
      ctx.arc(portraitSize / 2, portraitSize / 2, 43 * SS, 0, Math.PI * 2);
      ctx.clip();
      const src = this.textures.get(`portrait-${key}`).getSourceImage();
      ctx.drawImage(src as CanvasImageSource, 0, 0, portraitSize, portraitSize);
      ctx.restore();
      tex.refresh();
    }
    this.portrait = this.add
      .image(px, py, 'portrait-round-ready')
      .setDepth(11)
      .setDisplaySize(88, 88);

    // pressure gauge: a ring around the portrait that fills clockwise from the
    // top as digestion builds — the face literally sits inside its own meter
    this.meterArcTex = this.textures.createCanvas('hud-meter-arc', plateSize * SS, plateSize * SS)!;
    this.add.image(px, py, 'hud-meter-arc').setDepth(10).setDisplaySize(plateSize, plateSize);
    this.effectMeters = this.add.graphics().setDepth(12);

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

    // touch devices get zone hint labels from TouchControls instead
    if (!isTouchDevice()) {
      this.add
        .text(16, H - 26, `${t.kbClimb}     ${t.kbDive}     ${t.kbRip}`, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: COLOR_CREAM,
        })
        .setDepth(10)
        .setAlpha(0.75);
    }
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
    this.touch = new TouchControls(this);
    // mouse only — touch pointers are owned by TouchControls' split zones
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.wasTouch) return;
      if (p.rightButtonDown()) this.pointerPoop = true;
      else this.pointerFly = true;
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.wasTouch) return;
      if (!p.rightButtonDown()) this.pointerFly = false;
      this.pointerPoop = false;
    });
  }

  /** Development palette for testing scene objects on demand via ?debug. */
  private createDebugMenu(): void {
    const params = new URLSearchParams(location.search);
    if (!params.has('debug')) return;
    const x = W - 174;
    const y = 106;
    const buttonW = 48;
    const buttonH = 22;
    const gap = 4;

    this.add
      .text(x, y - 19, 'DEBUG SPAWN', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: COLOR_CREAM,
        stroke: COLOR_INK,
        strokeThickness: 3,
      })
      .setDepth(20);

    const addButton = (label: string, col: number, row: number, action: () => void): void => {
      const bx = x + col * (buttonW + gap);
      const by = y + row * (buttonH + gap);
      const bg = this.add
        .rectangle(bx, by, buttonW, buttonH, 0x1d1f2a, 0.9)
        .setOrigin(0)
        .setStrokeStyle(1, 0xf3ead8, 0.65)
        .setDepth(20)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(bx + buttonW / 2, by + buttonH / 2, label, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: COLOR_CREAM,
        })
        .setOrigin(0.5)
        .setDepth(21);
      bg.on('pointerdown', () => action());
      bg.on('pointerover', () => bg.setFillStyle(0x394257, 1));
      bg.on('pointerout', () => bg.setFillStyle(0x1d1f2a, 0.9));
    };

    const spawnHere = (kind: PickupKind): void =>
      this.spawnPickup(kind, this.pigeon.x + PICKUP_GRAB_X - 2, this.pigeonY);
    addButton('PED', 0, 0, () => this.spawnPed());
    addButton('CAR', 1, 0, () => this.spawnCar());
    addButton('HYDRA', 2, 0, () => this.spawnHydrant());
    addButton('RAIN', 0, 1, () => spawnHere('rainbow'));
    addButton('BREAD', 1, 1, () => spawnHere('bread'));
    addButton('FRIES', 2, 1, () => spawnHere('fries'));
    addButton('KEBAB', 0, 2, () => spawnHere('kebab'));
    addButton('CHILI', 1, 2, () => spawnHere('chilli'));
    addButton('COFF', 2, 2, () => spawnHere('coffee'));
    addButton('POD', 0, 3, () => spawnHere('pea'));
    addButton('GAS', 1, 3, () => this.activateGas());
  }

  update(_time: number, deltaMs: number): void {
    // normalize to 60 Hz frame units used by the sim
    const f = Math.min(deltaMs / (1000 / 60), 2);

    this.scrollWorld(f);
    this.updateProps(f, deltaMs);
    this.updatePigeon(f);
    this.updatePickups(f, deltaMs);
    this.updateVictims(f, deltaMs);
    this.updateHydrants(f, deltaMs);
    this.updateGuano(f);
    this.updateHud(f);
  }

  private scrollWorld(f: number): void {
    this.bgFar.tilePositionX += SCROLL * 0.25 * f;
    this.bgNear.update(SCROLL * 0.55 * f);
    this.sidewalkTs.tilePositionX += SCROLL * 0.55 * f;
    this.streetTs.tilePositionX += SCROLL * f;
    for (const cloud of this.clouds) {
      cloud.x -= (SCROLL * 0.06 + cloud.getData('drift')) * f;
      if (cloud.x < -170) {
        cloud.x = W + 170;
        cloud.y = 36 + Math.random() * 150;
        cloud.setScale(0.45 + Math.random() * 0.6);
      }
    }
  }

  /** sidewalk furniture scrolls with the ground, in front of the pedestrians */
  private updateProps(f: number, deltaMs: number): void {
    this.propTimer -= deltaMs;
    if (this.propTimer <= 0) {
      const kinds = ['bg-lamp', 'bg-tree', 'bg-mailbox'] as const;
      const key = kinds[(Math.random() * kinds.length) | 0];
      const prop = this.add
        .image(W + 90, 0, key)
        .setDepth(STREET_PROP_DEPTH)
        .setScale(0.21 + Math.random() * 0.03);
      if (key === 'bg-tree' && Math.random() < 0.5) prop.setFlipX(true);
      prop.setY(GROUND_Y - prop.displayHeight / 2 + 2);
      this.props.push(prop);
      this.propTimer = 2400 + Math.random() * 3600;
    }
    this.props = this.props.filter((p) => {
      p.x -= SCROLL * f;
      if (p.x < -140) {
        p.destroy();
        return false;
      }
      return true;
    });
  }

  private updatePigeon(f: number): void {
    const up = this.keys.up.isDown || this.keys.up2.isDown || this.pointerFly || this.touch.fly;
    const down = this.keys.down.isDown || this.touch.dive;
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
    const texture = kind === 'pea' ? 'pickup-pea-0' : `pickup-${kind}`;
    const sprite = this.add.image(x, y, texture).setScale(PICKUP_SCALE).setDepth(6.5);
    this.pickups.push({
      kind,
      sprite,
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      animT: 0,
    });
  }

  private updatePickups(f: number, deltaMs: number): void {
    this.rainbowPickupTimer -= deltaMs;
    if (this.rainbowPickupTimer <= 0) {
      this.spawnPickup('rainbow');
      this.rainbowPickupTimer =
        RAINBOW_PICKUP_MIN_MS +
        Math.random() * (RAINBOW_PICKUP_MAX_MS - RAINBOW_PICKUP_MIN_MS);
    }

    this.itemPickupTimer -= deltaMs;
    if (this.itemPickupTimer <= 0) {
      const kind = ITEM_PICKUP_KINDS[(Math.random() * ITEM_PICKUP_KINDS.length) | 0];
      this.spawnPickup(kind);
      this.itemPickupTimer =
        ITEM_PICKUP_MIN_MS + Math.random() * (ITEM_PICKUP_MAX_MS - ITEM_PICKUP_MIN_MS);
    }

    this.pickups = this.pickups.filter((p) => {
      p.sprite.x -= SCROLL * f;
      p.phase += 0.055 * f;
      p.animT += f;
      p.sprite.y = p.baseY + Math.sin(p.phase) * 9;
      // Pickups hang in the air and sway gently instead of coin-spinning.
      p.sprite.setAngle(Math.sin(p.phase * 0.8) * 7);
      const pulse = 1 + Math.sin(p.phase * 1.7) * 0.05;
      p.sprite.setScale(PICKUP_SCALE * pulse);
      if (p.kind === 'pea') {
        const lookFrame = Math.floor(p.animT / PEA_LOOK_FRAME_FRAMES) % 2;
        const texture = `pickup-pea-${lookFrame}`;
        if (p.sprite.texture.key !== texture) p.sprite.setTexture(texture);
      }

      const collected =
        Math.abs(p.sprite.x - this.pigeon.x) < PICKUP_GRAB_X &&
        Math.abs(p.sprite.y - this.pigeonY) < PICKUP_GRAB_Y;
      if (collected) {
        this.collectPickup(p.kind, p.sprite.x, p.sprite.y);
        p.sprite.destroy();
        return false;
      }
      if (p.sprite.x < -80) {
        p.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  private collectPickup(kind: PickupKind, x: number, y: number): void {
    if (kind === 'rainbow') {
      this.rainbowTimer = RAINBOW_DURATION;
      this.guanoFx.resetRainbowHue();
      this.pickupBurst(x, y, RAINBOW_COLORS);
      return;
    }

    const effect = ITEM_PICKUP_EFFECTS[kind];
    if (effect.pressureGain !== undefined) {
      this.meter = Math.min(100, this.meter + effect.pressureGain);
    }
    if (kind === 'coffee') this.coffeeTimer = COFFEE_DURATION;
    if (kind === 'chilli') {
      this.chilliTimer = CHILLI_DURATION;
      this.popup(x, y - 30, 'FIRE JET!!', COLOR_ORANGE, 20);
    }
    if (kind === 'pea') this.activateGas();
    this.pickupBurst(x, y, effect.burstColors);
  }

  private activateGas(): void {
    this.gasTimer = GAS_DURATION;
    this.guanoFx.rearmGasHeave();
  }

  private pickupBurst(x: number, y: number, colors: number[]): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dot = this.add.circle(x, y, 5, colors[i % colors.length]).setDepth(9);
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
    const v = (Math.random() * PED_VARIANT_COUNT) | 0;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const hueIndex = (Math.random() * VICTIM_PALETTE_HUES.length) | 0;
    const hue = VICTIM_PALETTE_HUES[hueIndex];
    // Only the first two pedestrians use the shader's secondary material:
    // a contrasting businessman tie and a natural runner hair shade.
    let accentHue = 0;
    if (v === 0) {
      accentHue =
        VICTIM_PALETTE_HUES[
            (hueIndex + 1 + ((Math.random() * (VICTIM_PALETTE_HUES.length - 1)) | 0)) %
              VICTIM_PALETTE_HUES.length
          ];
    } else if (v === 1) {
      accentHue = RUNNER_HAIR_HUES[(Math.random() * RUNNER_HAIR_HUES.length) | 0];
    }
    // Walkers always drift left on screen (own vx never beats SCROLL), so they
    // enter from the right. A rightward skater outruns the scroll and must
    // enter from the left instead.
    const vx =
      v === SKATER_VARIANT ? dir * (2.5 + Math.random() * 1.0) : dir * (0.3 + Math.random() * 0.5);
    const sprite = this.add
      .sprite(vx > SCROLL ? -40 : W + 40, 0, `ped-${v}`)
      .setScale(VICTIM_SCALE)
      .setDepth(PEDESTRIAN_DEPTH)
      .setFlipX(dir > 0)
      .setTint(victimPaletteTint(hue, v, 'ped', accentHue))
      .setPipeline(VICTIM_PALETTE_PIPELINE);
    sprite.setY(PED_GROUND_Y - sprite.displayHeight / 2);
    this.victims.push({
      sprite,
      kind: 'ped',
      variant: v,
      vx,
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
      .setDepth(CAR_DEPTH)
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
    const sprite = this.add
      .sprite(W + 40, 0, 'hydrant-0')
      .setScale(HYDRANT_SCALE)
      .setDepth(STREET_PROP_DEPTH);
    sprite.setY(GROUND_Y - sprite.displayHeight / 2);
    const jetCol = this.add
      .tileSprite(sprite.x, sprite.y, 14, 0, 'water-col')
      .setOrigin(0.5, 1)
      .setDepth(STREET_PROP_DEPTH)
      .setAlpha(0.88)
      .setVisible(false);
    const crown = this.add
      .image(sprite.x, sprite.y, 'water-crown')
      .setOrigin(0.5, 0.72)
      .setDepth(STREET_PROP_DEPTH)
      .setScale(0.4)
      .setVisible(false);
    this.hydrants.push({
      sprite,
      jetCol,
      crown,
      warnFx: this.add.graphics().setDepth(STREET_PROP_DEPTH),
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
        this.sound.play('sfx-hydrant-clank', {
          volume: 0.34 * SFX_VOLUME,
          rate: Phaser.Math.FloatBetween(0.98, 1.02),
        });
      } else if (h.state === 'warn' && h.timer <= 0) {
        h.state = 'burst';
        h.timer = 130;
        this.startHydrantJet(h);
        // always tall enough to reach the default cruise line (forces a climb
        // to dodge) but never so tall the ceiling clamp can't out-climb it
        h.jetMaxH = 280 + Math.random() * 70;
      } else if (h.state === 'burst' && h.timer <= 0) {
        h.state = 'idle';
        h.splashed = true; // burst spent — never re-arm
        h.sprite.setTexture('hydrant-0');
        this.stopHydrantJet(h);
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
          this.sound.play('sfx-splash-hydrant', {
            volume: 0.5 * SFX_VOLUME,
            rate: Phaser.Math.FloatBetween(0.96, 1.04),
          });
          // the indignant coo lands as a reaction, just after the water hits
          this.time.delayedCall(220, () => {
            this.sound.play('sfx-koo-irritated', {
              volume: 0.55 * SFX_VOLUME,
              rate: Phaser.Math.FloatBetween(0.97, 1.05),
            });
          });
        }
      }

      h.collider.x = h.sprite.x;
      h.collider.y = h.sprite.y;
      h.collider.vx = -SCROLL * f;
      h.collider.mask = getAlphaMask(this, h.sprite.texture.key);
    }

    this.hydrants = this.hydrants.filter((h) => {
      if (h.sprite.x < -160) {
        this.stopHydrantJet(h, false);
        h.sprite.destroy();
        h.jetCol.destroy();
        h.crown.destroy();
        h.warnFx.destroy();
        return false;
      }
      return true;
    });
  }

  private startHydrantJet(h: Hydrant): void {
    this.stopHydrantJet(h, false);
    const sound = this.sound.add('sfx-hydrant-jet-loop', {
      loop: true,
      volume: 0.18 * SFX_VOLUME,
    }) as AdjustableSound;
    sound.play();
    // BaseSound resets its config when play begins; set the live gain after it starts.
    sound.volume = 0.18 * SFX_VOLUME;
    h.jetSound = sound;
  }

  private stopHydrantJet(h: Hydrant, fade = true): void {
    const sound = h.jetSound;
    if (!sound) return;
    h.jetSound = undefined;
    if (!fade || !sound.isPlaying) {
      sound.stop();
      sound.destroy();
      return;
    }
    this.tweens.add({
      targets: sound,
      volume: 0,
      duration: 120,
      ease: 'Quad.easeOut',
      onComplete: () => {
        sound.stop();
        sound.destroy();
      },
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
        if (v.variant === SKATER_VARIANT && v.reactTimer <= 0) {
          // alternate stride poses for the leg-pumping speed read
          const stride = ((v.bobT / (0.25 * SKATER_STRIDE_FRAMES)) | 0) % 2;
          const key = stride === 0 ? `ped-${SKATER_VARIANT}` : `ped-${SKATER_VARIANT}-b`;
          if (v.sprite.texture.key !== key) v.sprite.setTexture(key);
        }
        // skates glide; walkers bob a full 3px
        const bob = v.variant === SKATER_VARIANT ? -1.5 : -3;
        v.sprite.y = PED_GROUND_Y - v.sprite.displayHeight / 2 + Math.abs(Math.sin(v.bobT)) * bob;
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
      // rightward skaters outrun the scroll and exit stage right
      if (v.sprite.x < -160 || v.sprite.x > W + 160) {
        v.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  private onSplat(v: Victim, p: Particle, _impact: number): void {
    this.onVictimHit(v, p.rainbow, 'goo');
  }

  private onVictimHit(v: Victim, joyful: boolean, source: 'goo' | 'gas'): void {
    // even a cooldown-gated touch proves the volley connected
    this.salvoHit = true;
    if (v.hitCooldown > 0) return;
    v.hitCooldown = 30;

    // This path is already cooldown-gated per victim, so a dense fluid blob
    // reads as one impact instead of layering dozens of identical one-shots.
    // Gas has its own collision reaction and deliberately does not splat.
    if (source === 'goo') {
      this.sound.play(v.kind === 'car' ? 'sfx-splat-car' : 'sfx-splat-ped', {
        volume: (v.kind === 'car' ? 0.58 : 0.65) * SFX_VOLUME,
        rate: Phaser.Math.FloatBetween(0.94, 1.06),
      });
    }

    this.comboTimer = 120;
    // the visible counter is uncapped (rank spectacle); scoring plateaus at x8
    this.combo += 1;
    // The skater pays 4x a walker: he's fast, and the lead is the skill test.
    const base =
      v.kind === 'car' ? 25 : v.variant === SKATER_VARIANT ? SKATER_BASE_SCORE : 10;
    const pts = base * Math.min(this.combo, 8);
    this.score += pts;

    // Rainbow goo flips the mood. Gas stays disgusting but gets its own hit verb.
    const label =
      source === 'gas'
        ? v.kind === 'car'
          ? 'PFFFFT!'
          : 'GASSED!'
        : v.kind === 'car'
          ? 'DING!'
          : ['SPLAT!', 'GOTCHA!', 'BULLSEYE!'][(Math.random() * 3) | 0];
    this.popup(v.sprite.x, v.sprite.y - 46, `${label} +${pts}`);

    // reaction frame (outraged or delighted), reverted by updateVictims after REACT_FRAMES
    v.sprite.setTexture(`${v.kind}-${v.variant}${joyful ? '-rainbow' : '-r'}`);
    v.reactTimer = REACT_FRAMES;

    // A voiced reaction replaces this hit's text line (backlog: sound over pop-ups);
    // gating constants are defined next to the line tables.
    const voiced =
      (v.kind === 'ped' ? VOCAL_PED_VARIANTS : VOCAL_CAR_VARIANTS).has(v.variant) &&
      this.time.now >= this.nextVictimVoiceAt &&
      Math.random() < VICTIM_VOICE_CHANCE;
    if (voiced) {
      this.nextVictimVoiceAt = this.time.now + VICTIM_VOICE_COOLDOWN_MS;
      const [key, vol] =
        v.kind === 'car'
          ? joyful
            ? (['sfx-car-honk-happy', 0.42] as const)
            : (['sfx-car-honk-angry', 0.45] as const)
          : joyful
            ? ([`sfx-ped-delight-${v.variant}`, PED_DELIGHT_VOLUME[v.variant]] as const)
            : ([`sfx-ped-grumble-${v.variant}`, PED_GRUMBLE_VOLUME[v.variant]] as const);
      this.time.delayedCall(VICTIM_VOICE_DELAY_MS, () =>
        this.sound.play(key, {
          volume: vol * SFX_VOLUME,
          rate: Phaser.Math.FloatBetween(0.92, 1.08),
        }),
      );
    }

    if (v.kind === 'ped') {
      // The jogger and map-covered tourist shudder; broader poses shake harder.
      // y is owned by the bob update, so do not tween it here.
      const wiggle = v.variant === 1 || v.variant === 4 ? 5 : 9;
      this.tweens.add({
        targets: v.sprite,
        angle: { from: -wiggle, to: wiggle },
        duration: 80,
        yoyo: true,
        repeat: 3,
        onComplete: () => v.sprite.setAngle(0),
      });
      if (!voiced) {
        const line = joyful ? PED_LINES_RAINBOW[v.variant] : PED_LINES[v.variant];
        this.popup(v.sprite.x + 18, v.sprite.y - 70, line, joyful ? COLOR_JOY_GREEN : COLOR_ORANGE, 15);
      }
    } else {
      // suspension dip; the van wobbles twice (a happy car bounces once more)
      this.tweens.add({
        targets: v.sprite,
        scaleY: v.sprite.scaleY * 0.9,
        duration: 70,
        yoyo: true,
        repeat: (v.variant === 2 ? 2 : 0) + (joyful ? 1 : 0),
      });
      if (!voiced) {
        const line = joyful ? CAR_LINES_RAINBOW[v.variant] : CAR_LINES[v.variant];
        this.popup(v.sprite.x - 30, v.sprite.y - 40, line, joyful ? COLOR_JOY_GREEN : COLOR_AMBER, 15);
      }
    }
  }

  private onAsphaltSplat(p: Particle, impact: number): void {
    // Runoff dripping off a victim or the hydrant lands silently — the hit that put
    // it there already made its noise, and dozens of trickling drops read as clicks.
    if (p.wasStuck) return;
    if (impact < 2.2 || this.time.now < this.nextAsphaltSplatAt) return;
    this.nextAsphaltSplatAt = this.time.now + ASPHALT_SPLAT_COOLDOWN_MS;
    this.sound.play('sfx-splat-asphalt', {
      volume: Phaser.Math.Clamp(0.34 + impact * 0.025, 0.42, 0.62) * SFX_VOLUME,
      rate: Phaser.Math.FloatBetween(0.95, 1.05),
    });
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
    this.coffeeTimer = Math.max(0, this.coffeeTimer - f);
    this.chilliTimer = Math.max(0, this.chilliTimer - f);
    this.gasTimer = Math.max(0, this.gasTimer - f);
    if (this.gasTimer <= 0) this.guanoFx.stopGasStream();
    if (Phaser.Input.Keyboard.JustDown(this.keys.damage)) this.scarePoop();

    const digestionRate =
      PASSIVE_DIGESTION_PER_FRAME * (this.coffeeTimer > 0 ? COFFEE_FILL_MULTIPLIER : 1);
    this.meter = Math.min(100, this.meter + digestionRate * f);
    if (this.meter >= EMPTY_LOCK_RELEASE) this.emptyLock = false;

    // full = involuntary blowout: one huge uncontrolled blast until empty
    if (this.meter >= 100 && this.dumpKind === 'none') {
      this.dumpKind = 'blowout';
      this.popup(this.pigeon.x, this.pigeonY - 52, 'BLOWOUT!!', COLOR_ORANGE, 22);
      this.cameras.main.shake(160, 0.003);
    }

    const wantsPoop = this.keys.poop.isDown || this.pointerPoop || this.touch.poop;
    const wasPooping = this.pooping;
    this.pooping = this.dumpKind === 'none' && !this.emptyLock && wantsPoop && this.meter > 0;
    if (wasPooping && !this.pooping) this.relievedTimer = 60;

    // squeezing an empty tank: telegraph WHY nothing comes out — an empty-belly
    // rumble and a hungry face instead of silently eating the input
    this.squeezingEmpty = wantsPoop && !this.pooping && this.dumpKind === 'none';
    this.bellyRumbleCooldown = Math.max(0, this.bellyRumbleCooldown - f);
    if (this.squeezingEmpty && this.bellyRumbleCooldown <= 0) {
      this.bellyRumbleCooldown = 130; // sound runs ~1.7s — don't let it overlap itself
      this.sound.play('sfx-belly-rumble', {
        volume: 0.55 * SFX_VOLUME,
        rate: Phaser.Math.FloatBetween(0.94, 1.06),
      });
    }
    if (!this.pooping && this.dumpKind === 'none') this.guanoFx.stopGasStream();

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

    // A volley is judged once the last of it lands: if nothing fired since the
    // stream opened ever touched a victim, that's a complete miss — the chain
    // breaks immediately instead of coasting on the frozen combo clock.
    const emitting = this.pooping || this.dumpKind !== 'none';
    if (this.salvoActive && !emitting && this.guanoFx.airborneGooCount === 0) {
      this.salvoActive = false;
      if (!this.salvoHit && this.combo > 0) {
        if (this.combo > 1) this.popup(this.pigeon.x, this.pigeonY - 52, 'MISS…', '#9aa0b0', 16);
        this.combo = 0;
      }
    }

    this.guanoFx.update(
      f,
      [...this.victims.map((v) => v.collider), ...this.hydrants.map((h) => h.collider)],
      this.victims.map((v) => ({
        id: v.collider.id,
        x: v.collider.x,
        y: v.collider.y,
        hw: v.collider.hw,
        hh: v.collider.hh,
        onHit: () => this.onVictimHit(v, false, 'gas'),
      })),
    );
  }

  /** Supplies scene-owned state and the bird's current transform to the effect subsystem. */
  private emitStream(rate: number, wild: boolean): void {
    const rainbow = this.rainbowDebug || this.rainbowTimer > 0;
    // gas clouds drift too loosely to judge as hit-or-miss, so they never arm a salvo
    if (this.gasTimer <= 0 && !this.salvoActive) {
      this.salvoActive = true;
      this.salvoHit = false;
    }
    this.guanoFx.emitStream({
      rate,
      wild,
      x: this.pigeon.x - 42,
      y: this.pigeonY + 24,
      sourceVy: this.pigeonVy,
      rainbow,
      fire: !rainbow && this.chilliTimer > 0,
      gas: this.gasTimer > 0,
    });
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
   * strain → hungry → pleased → ready. Escalations switch instantly;
   * de-escalations wait out a minimum hold so competing states can't flicker
   * frame-by-frame.
   */
  private desiredPortrait(): PortraitKey {
    if (this.batteredTimer > 0) return 'damage';
    if (this.dumpKind === 'blowout' || this.meter >= 92) return 'panic';
    if (this.pooping || this.dumpKind === 'scare' || this.meter > 85) return 'strain';
    if (this.squeezingEmpty) return 'hungry';
    if (this.relievedTimer > 0 || this.emptyLock) return 'pleased';
    return 'ready';
  }

  private drawEffectMeter(
    g: Phaser.GameObjects.Graphics,
    y: number,
    fraction: number,
    colors: number[],
  ): void {
    const x = 20;
    const w = 88;
    const h = 7;
    const fillW = Math.round(w * Phaser.Math.Clamp(fraction, 0, 1));

    g.fillStyle(0x0e0f16, 0.95);
    g.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 3);
    g.fillStyle(0x292c39, 0.92);
    g.fillRect(x, y, w, h);

    for (let i = 0; i < colors.length; i++) {
      const segmentX = x + Math.floor((i * w) / colors.length);
      const segmentEnd = x + Math.floor(((i + 1) * w) / colors.length);
      const visibleW = Math.min(segmentEnd, x + fillW) - segmentX;
      if (visibleW <= 0) break;
      g.fillStyle(colors[i], 1);
      g.fillRect(segmentX, y, visibleW, h);
    }

    g.lineStyle(1, 0xf3ead8, 0.55);
    g.strokeRoundedRect(x - 1, y - 1, w + 2, h + 2, 2);
  }

  private updateHud(f: number): void {
    // The combo window measures time between HITS, but goo takes real time to
    // fall — a drop led onto a road-level car can spend most of the window in
    // the air, so the chain used to die mid-flight and the landing read as a
    // reset. Freeze the countdown while a shot is still airborne (or leaving
    // the pigeon); missed goo grounds within a second, so decay resumes fast.
    if (!this.pooping && this.guanoFx.airborneGooCount === 0) this.comboTimer -= f;
    if (this.comboTimer <= 0) this.combo = 0;
    this.batteredTimer -= f;
    this.relievedTimer -= f;
    this.portraitHold -= f;

    const RANK: Record<PortraitKey, number> = {
      ready: 0,
      pleased: 1,
      hungry: 2,
      strain: 3,
      panic: 4,
      damage: 5,
    };
    const want = this.desiredPortrait();
    if (want !== this.portraitKey && (RANK[want] > RANK[this.portraitKey] || this.portraitHold <= 0)) {
      this.portraitKey = want;
      this.portraitHold = 18;
      this.portrait.setTexture(`portrait-round-${want}`).setDisplaySize(88, 88);
    }
    // effort states puff the face slightly
    const puff = this.portraitKey === 'strain' || this.portraitKey === 'panic' ? 1.06 : 1;
    this.portrait.setScale((88 / this.portrait.width) * puff);

    const rank = rankForCombo(this.combo);
    if (rank.tier !== this.rankTier) this.applyRank(rank);

    this.scoreText.setText(String(this.score));
    this.comboText.setText(this.combo > 1 ? `x${this.combo}` : '');
    this.music.setCombo(this.combo);

    // SHITSTORM: tint-based hue cycle (setColor would re-rasterize every frame)
    if (rank.rainbow && this.combo > 1) {
      this.rankHue = (this.rankHue + 0.01 * f) % 1;
      this.comboText.setTint(Phaser.Display.Color.HSVToRGB(this.rankHue, 0.75, 1).color);
    }
    this.effectMeters.clear();
    let effectY = 118;
    if (this.rainbowTimer > 0) {
      this.drawEffectMeter(
        this.effectMeters,
        effectY,
        this.rainbowTimer / RAINBOW_DURATION,
        RAINBOW_COLORS,
      );
      effectY += 13;
    }
    if (this.coffeeTimer > 0) {
      this.drawEffectMeter(
        this.effectMeters,
        effectY,
        this.coffeeTimer / COFFEE_DURATION,
        [0x5a2f1f, 0x8b4b2b, 0xc98445, 0xe1aa61],
      );
      effectY += 13;
    }
    if (this.chilliTimer > 0) {
      this.drawEffectMeter(
        this.effectMeters,
        effectY,
        this.chilliTimer / CHILLI_DURATION,
        ITEM_PICKUP_EFFECTS.chilli.burstColors,
      );
      effectY += 13;
    }
    if (this.gasTimer > 0) {
      this.drawEffectMeter(this.effectMeters, effectY, this.gasTimer / GAS_DURATION, GAS_COLORS);
    }

    // pressure ring: fills clockwise from 12 o'clock, goes amber then pulsing
    // red as the blowout approaches
    const frac = this.meter / 100;
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
    // only re-rasterise + re-upload the arc texture when it visibly changes
    const arcKey = frac > 0.01 ? `${Math.ceil(frac * 400)}:${color}` : '';
    if (arcKey !== this.meterArcKey) {
      this.meterArcKey = arcKey;
      const ctx = this.meterArcTex.context;
      const size = this.meterArcTex.width;
      ctx.clearRect(0, 0, size, size);
      if (frac > 0.01) {
        ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 106, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.stroke();
      }
      this.meterArcTex.refresh();
    }
  }
}
