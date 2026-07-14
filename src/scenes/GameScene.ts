import Phaser from 'phaser';
import { GooSim, type Collider, type Particle } from '../goo/GooSim';
import { GooLayer } from '../goo/GooLayer';
import { buildTextures, W, H, GROUND_Y } from '../world/textures';

const SCROLL = 2.1; // world scroll, px/frame
const GUANO_TINT = 0xf2ecd4;

interface Victim {
  sprite: Phaser.GameObjects.Sprite;
  collider: Collider;
  kind: 'ped' | 'car';
  vx: number; // own velocity, px/frame (screen space handled in update)
  hitCooldown: number;
  bobT: number;
}

export class GameScene extends Phaser.Scene {
  private sim!: GooSim;
  private gooLayer!: GooLayer;

  private pigeon!: Phaser.GameObjects.Container;
  private pigeonImg!: Phaser.GameObjects.Image;
  private pigeonShadow!: Phaser.GameObjects.Image;
  private pigeonY = 200;
  private pigeonVy = 0;
  private flapPhase = 0;

  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;
  private streetTs!: Phaser.GameObjects.TileSprite;

  private victims: Victim[] = [];
  private nextColliderId = 1;
  private pedTimer = 0;
  private carTimer = 0;

  private meter = 100;
  private score = 0;
  private combo = 0;
  private comboTimer = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private meterFill!: Phaser.GameObjects.Graphics;
  private portrait!: Phaser.GameObjects.Image;
  private portraitTimer = 0;
  private pleasedTimer = 0;
  private pooping = false;

  private keys!: Record<'up' | 'up2' | 'poop' | 'poop2' | 'rainbow' | 'damage', Phaser.Input.Keyboard.Key>;
  private pointerFly = false;
  private pointerPoop = false;
  private rainbow = false;
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
    this.load.image('pigeon-f0', 'assets/sprites/pigeon-f0.png');
    this.load.image('pigeon-f1', 'assets/sprites/pigeon-f1.png');
    this.load.image('pigeon-f2', 'assets/sprites/pigeon-f2.png');
  }

  create(): void {
    buildTextures(this);

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

    this.pigeonImg = this.add.image(0, 0, 'pigeon-f1').setScale(0.42);
    this.pigeon = this.add.container(240, this.pigeonY, [this.pigeonImg]).setDepth(7);

    this.createHud();
    this.createInput();

    // expose hooks for headless screenshot driving
    (window as unknown as Record<string, unknown>).SP = {
      scene: this,
      setFly: (v: boolean) => (this.pointerFly = v),
      setPoop: (v: boolean) => (this.pointerPoop = v),
      setRainbow: (v: boolean) => (this.rainbow = v),
      particleCount: () => this.sim.particles.length,
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

    // guano meter
    this.add.rectangle(px, py + 60, 92, 12, 0x1d1f2a).setDepth(10).setStrokeStyle(2, 0x0e0f16);
    this.meterFill = this.add.graphics().setDepth(11);

    this.scoreText = this.add
      .text(W - 24, 18, '0', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '34px',
        color: '#f3ead8',
        stroke: '#1d1f2a',
        strokeThickness: 6,
      })
      .setOrigin(1, 0)
      .setDepth(10);
    this.comboText = this.add
      .text(W - 24, 58, '', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '20px',
        color: '#ffd34e',
        stroke: '#1d1f2a',
        strokeThickness: 4,
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.add
      .text(16, H - 26, 'HOLD SPACE / LMB — fly     HOLD S / RMB — let it rip     R — rainbow mode', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#f3ead8',
      })
      .setDepth(10)
      .setAlpha(0.75);
  }

  private createInput(): void {
    const kb = this.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      up2: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      poop: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      poop2: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      rainbow: kb.addKey(Phaser.Input.Keyboard.KeyCodes.R),
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
    this.updateVictims(f, deltaMs);
    this.updateGuano(f);
    this.updateHud(f);
  }

  private scrollWorld(f: number): void {
    this.bgFar.tilePositionX += SCROLL * 0.25 * f;
    this.bgNear.tilePositionX += SCROLL * 0.55 * f;
    this.streetTs.tilePositionX += SCROLL * f;
  }

  private updatePigeon(f: number): void {
    const flying =
      this.keys.up.isDown || this.keys.up2.isDown || this.pointerFly;
    this.pigeonVy += (flying ? -0.55 : 0.38) * f;
    this.pigeonVy = Phaser.Math.Clamp(this.pigeonVy, -6.5, 7);
    this.pigeonY = Phaser.Math.Clamp(this.pigeonY + this.pigeonVy * f, 56, GROUND_Y - 90);
    if (this.pigeonY <= 56 || this.pigeonY >= GROUND_Y - 90) this.pigeonVy = 0;

    // wing flap: fast while thrusting, lazy glide otherwise
    this.flapPhase += (flying ? 0.22 : 0.07) * f;
    const flapSeq = [0, 1, 2, 1];
    this.pigeonImg.setTexture(`pigeon-f${flapSeq[Math.floor(this.flapPhase) % 4]}`);

    this.pigeon.setY(this.pigeonY);
    this.pigeon.setRotation(Phaser.Math.Clamp(this.pigeonVy * 0.06, -0.3, 0.35));

    const alt = (GROUND_Y - this.pigeonY) / (GROUND_Y - 56);
    this.pigeonShadow.setScale(1 - alt * 0.55, 1 - alt * 0.4).setAlpha(0.5 - alt * 0.25);
  }

  private spawnPed(): void {
    const v = (Math.random() * 3) | 0;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const sprite = this.add
      .sprite(W + 40, GROUND_Y - 28, `ped-${v}`)
      .setDepth(5)
      .setFlipX(dir < 0);
    this.victims.push({
      sprite,
      kind: 'ped',
      vx: dir * (0.3 + Math.random() * 0.5),
      hitCooldown: 0,
      bobT: Math.random() * 10,
      collider: {
        id: this.nextColliderId++,
        x: sprite.x,
        y: sprite.y,
        hw: 15,
        hh: 28,
        vx: 0,
        vy: 0,
        sticky: true,
      },
    });
  }

  private spawnCar(): void {
    const v = (Math.random() * 2) | 0;
    const sprite = this.add.sprite(W + 80, GROUND_Y + 6, `car-${v}`).setDepth(5).setFlipX(true);
    this.victims.push({
      sprite,
      kind: 'car',
      vx: -(1.6 + Math.random() * 1.2),
      hitCooldown: 0,
      bobT: 0,
      collider: {
        id: this.nextColliderId++,
        x: sprite.x,
        y: sprite.y,
        hw: 58,
        hh: 24,
        vx: 0,
        vy: 0,
        sticky: true,
      },
    });
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
      if (v.kind === 'ped') {
        v.bobT += 0.25 * f;
        v.sprite.y = GROUND_Y - 28 + Math.abs(Math.sin(v.bobT)) * -3;
      }
      v.collider.x = v.sprite.x;
      v.collider.y = v.sprite.y;
      v.collider.vx = screenVx * f;
      v.collider.vy = 0;
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

  private onSplat(v: Victim, _p: Particle, _impact: number): void {
    if (v.hitCooldown > 0) return;
    v.hitCooldown = 30;

    this.comboTimer = 120;
    this.pleasedTimer = 55;
    this.combo = Math.min(this.combo + 1, 8);
    const base = v.kind === 'car' ? 25 : 10;
    const pts = base * this.combo;
    this.score += pts;

    const label = v.kind === 'car' ? 'DING!' : ['SPLAT!', 'GOTCHA!', 'BULLSEYE!'][(Math.random() * 3) | 0];
    this.popup(v.sprite.x, v.sprite.y - 46, `${label} +${pts}`);

    if (v.kind === 'ped') {
      // indignant hop
      this.tweens.add({ targets: v.sprite, y: v.sprite.y - 14, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
      this.popup(v.sprite.x + 18, v.sprite.y - 70, '@#$%!', '#ff8a5c', 15);
    } else {
      this.tweens.add({ targets: v.sprite, scaleY: 0.92, duration: 70, yoyo: true });
      this.popup(v.sprite.x - 30, v.sprite.y - 40, 'HONK!', '#ffd34e', 15);
    }
  }

  private popup(x: number, y: number, msg: string, color = '#f3ead8', size = 19): void {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: `${size}px`,
        color,
        stroke: '#1d1f2a',
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
    if (Phaser.Input.Keyboard.JustDown(this.keys.rainbow)) this.rainbow = !this.rainbow;
    if (Phaser.Input.Keyboard.JustDown(this.keys.damage)) this.takeDamage();

    const pooping =
      (this.keys.poop.isDown || this.keys.poop2.isDown || this.pointerPoop) && this.meter > 0;
    this.pooping = pooping;

    if (pooping) {
      this.meter = Math.max(0, this.meter - 0.45 * f);
      this.emitCarry += 0.9 * f;
      const n = Math.floor(this.emitCarry);
      this.emitCarry -= n;
      if (n > 0) {
        let tint = GUANO_TINT;
        if (this.rainbow) {
          this.rainbowHue = (this.rainbowHue + 0.02) % 1;
          tint = Phaser.Display.Color.HSVToRGB(this.rainbowHue, 0.75, 1).color;
        }
        // emit from under the tail, inheriting a bit of the pigeon's motion
        const tailX = this.pigeon.x - 42;
        const tailY = this.pigeonY + 24;
        this.sim.emit(tailX, tailY, -0.4, this.pigeonVy * 0.35 + 4.2, tint, n);
      }
      this.portrait.setScale((88 / this.portrait.width) * 1.06);
    } else {
      this.meter = Math.min(100, this.meter + 0.42 * f);
      if (this.portraitTimer <= 0) this.portrait.setScale(88 / this.portrait.width);
    }

    this.sim.step(this.victims.map((v) => v.collider));
    this.gooLayer.render(this.sim.particles);
  }

  private takeDamage(): void {
    this.portraitTimer = 90;
    this.portrait.setTexture('portrait-damage').setDisplaySize(88, 88);
    this.cameras.main.shake(120, 0.004);
    this.combo = 0;
  }

  private updateHud(f: number): void {
    this.comboTimer -= f;
    if (this.comboTimer <= 0) this.combo = 0;
    this.portraitTimer -= f;
    this.pleasedTimer -= f;
    const portraitTexture = this.portraitTimer > 0
      ? 'portrait-damage'
      : this.pleasedTimer > 0 ? 'portrait-pleased'
      : this.pooping ? 'portrait-strain' : 'portrait-normal';
    if (this.portrait.texture.key !== portraitTexture) {
      this.portrait.setTexture(portraitTexture).setDisplaySize(88, 88);
      if (this.pooping) this.portrait.setScale((88 / this.portrait.width) * 1.06);
    }

    this.scoreText.setText(String(this.score));
    this.comboText.setText(this.combo > 1 ? `x${this.combo} COMBO` : '');

    this.meterFill.clear();
    const w = (88 * this.meter) / 100;
    this.meterFill.fillStyle(this.rainbow ? 0xffd34e : 0xf2ecd4, 1);
    this.meterFill.fillRect(64 - 44, 64 + 55, w, 8);
  }
}
