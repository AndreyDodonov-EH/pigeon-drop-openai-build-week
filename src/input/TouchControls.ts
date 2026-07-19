import Phaser from 'phaser';
import { W, H } from '../world/textures';

/** Coarse-pointer check for cosmetic gating (hints, debug menu). Gameplay
 * reacts to actual touch events via `pointer.wasTouch`, never this. */
export const isTouchDevice = (): boolean =>
  window.matchMedia('(pointer: coarse)').matches;

// Dive ratchet thresholds, in game pixels (960×540 space). Asymmetric on
// purpose: entering a dive takes a deliberate pull, returning to climb is
// slightly easier so pumping between the two feels responsive.
const DIVE_ON = 36;
const DIVE_OFF = 24;

// cumulative hold per side before its hint/finger clears — a stray tap
// (e.g. dismissing the wizard) shouldn't count as "learned the control"
const HINT_HOLD_MS = 600;

const HINT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize: '14px',
  color: '#f3ead8',
};

/**
 * Invisible split-screen touch controls: left half holds to climb (drag down
 * while holding to dive, ratcheting back up to climb), right half holds to
 * poop. Each half is claimed by one pointer id so both thumbs work at once.
 * Desktop mouse pointers are ignored entirely (`wasTouch` gate).
 */
export class TouchControls {
  fly = false;
  dive = false;
  poop = false;

  private flyId = -1;
  private poopId = -1;
  private anchorY = 0;
  private leftFinger?: Phaser.GameObjects.Image;
  private rightFinger?: Phaser.GameObjects.Image;
  private rightPoo?: Phaser.GameObjects.Text;
  private heldMs = { left: 0, right: 0 };
  private downAt = { left: 0, right: 0 };
  private clearTimer: {
    left?: Phaser.Time.TimerEvent;
    right?: Phaser.Time.TimerEvent;
  } = {};

  constructor(private scene: Phaser.Scene) {
    scene.input.on('pointerdown', this.onDown, this);
    // touches landing in the FIT letterbox bars hit the page, not the canvas,
    // and Phaser reports those as the *outside* variant
    scene.input.on('pointerdownoutside', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
    // backgrounded tab / incoming call: drop everything, don't leave the
    // pigeon climbing or the tap unspent
    scene.game.events.on(Phaser.Core.Events.BLUR, this.releaseAll, this);
    // lock only once fullscreen has actually engaged — locking in the same
    // tick as the request silently rejects (fullscreen isn't active yet)
    scene.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, this.lockLandscape, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.game.events.off(Phaser.Core.Events.BLUR, this.releaseAll, this);
      scene.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, this.lockLandscape, this);
    });

    if (isTouchDevice()) this.createFingers();
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (!p.wasTouch) return;
    this.tryFullscreen();
    if (p.x < W / 2) {
      if (this.flyId < 0) {
        this.flyId = p.id;
        this.fly = true;
        this.dive = false;
        this.anchorY = p.y;
        this.beginHold('left');
      }
    } else if (this.poopId < 0) {
      this.poopId = p.id;
      this.poop = true;
      this.beginHold('right');
    }
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (p.id !== this.flyId) return;
    if (!this.dive) {
      // anchor rides the thumb's highest point, so only a fresh downward
      // pull — not slow drift — crosses the threshold
      this.anchorY = Math.min(this.anchorY, p.y);
      if (p.y - this.anchorY > DIVE_ON) {
        this.dive = true;
        this.fly = false;
        this.anchorY = p.y;
      }
    } else {
      this.anchorY = Math.max(this.anchorY, p.y);
      if (this.anchorY - p.y > DIVE_OFF) {
        this.dive = false;
        this.fly = true;
        this.anchorY = p.y;
      }
    }
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id === this.flyId) {
      this.flyId = -1;
      this.fly = false;
      this.dive = false;
      this.endHold('left');
    }
    if (p.id === this.poopId) {
      this.poopId = -1;
      this.poop = false;
      this.endHold('right');
    }
  }

  private releaseAll(): void {
    this.endHold('left');
    this.endHold('right');
    this.flyId = -1;
    this.poopId = -1;
    this.fly = false;
    this.dive = false;
    this.poop = false;
  }

  private tryFullscreen(): void {
    const scale = this.scene.scale;
    if (!scale.fullscreen.available) return; // iOS Safari: unavailable, no-op
    // rotation can drop browser fullscreen behind Phaser's back — trust the
    // DOM, and resync Phaser's flag if it went stale, so this tap re-enters
    const fsEl =
      document.fullscreenElement ?? (document as any).webkitFullscreenElement;
    if (fsEl) return;
    try {
      if (scale.isFullscreen) scale.stopFullscreen();
      scale.startFullscreen();
    } catch {
      /* user gesture expired or browser refused — try again next tap */
    }
  }

  private lockLandscape(): void {
    (screen.orientation as any)?.lock?.('landscape')?.catch(() => {});
  }

  private createFingers(): void {
    // left hand carries baked-in up/down arrows (climb/dive drag axis);
    // the right action is a plain hold, so it gets the plain tap hand.
    // Ship sprites are authored at 2x, hence the 0.5 base scale.
    const make = (x: number, tex: string, flip: boolean): Phaser.GameObjects.Image | undefined => {
      if (!this.scene.textures.exists(tex)) return undefined; // sprite failed to load
      const img = this.scene.add
        .image(x, H * 0.66, tex)
        .setFlipX(flip)
        .setAlpha(0.95)
        // 31: above the how-to overlay's dim (30) — the fingers ARE the
        // how-to, and they outlive it until each action is performed
        .setDepth(31)
        .setScale(0.5);
      // gentle pressing bob: "hold your thumb right here"
      this.scene.tweens.add({
        targets: img,
        y: img.y + 7,
        scale: 0.46,
        duration: 380,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      return img;
    };
    const leftTex = this.scene.textures.exists('drag-hand') ? 'drag-hand' : 'tap-hand';
    this.leftFinger = make(W * 0.25, leftTex, false);
    this.rightFinger = make(W * 0.75, 'tap-hand', true);

    // subtle payload label over the right fingertip — the hands say "hold
    // here", this says what the right hold does
    if (this.rightFinger) {
      this.rightPoo = this.scene.add
        .text(W * 0.75 + 32, H * 0.66 - 44, '💩', HINT_STYLE)
        .setFontSize(22)
        .setOrigin(0.5)
        .setDepth(31)
        .setAlpha(0.75);
    }
  }

  /** Arm the clear timer for a side: once cumulative hold time crosses
   * HINT_HOLD_MS the player has demonstrably performed the action and the
   * hint + finger fade. Released early → endHold banks the partial time. */
  private beginHold(side: 'left' | 'right'): void {
    const alive = side === 'left' ? this.leftFinger : this.rightFinger;
    if (!alive) return;
    this.downAt[side] = this.scene.time.now;
    this.clearTimer[side] = this.scene.time.delayedCall(
      Math.max(0, HINT_HOLD_MS - this.heldMs[side]),
      () => this.clearHints(side),
    );
  }

  private endHold(side: 'left' | 'right'): void {
    const timer = this.clearTimer[side];
    if (!timer) return;
    this.heldMs[side] += this.scene.time.now - this.downAt[side];
    timer.remove();
    this.clearTimer[side] = undefined;
  }

  private clearHints(side: 'left' | 'right'): void {
    this.clearTimer[side] = undefined;
    if (side === 'left') {
      this.fadeHint(this.leftFinger);
      this.leftFinger = undefined;
    } else {
      this.fadeHint(this.rightFinger);
      this.fadeHint(this.rightPoo);
      this.rightFinger = undefined;
      this.rightPoo = undefined;
    }
  }

  private fadeHint(hint?: Phaser.GameObjects.Text | Phaser.GameObjects.Image): void {
    if (!hint) return;
    this.scene.tweens.killTweensOf(hint); // stop the bob before fading
    this.scene.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 500,
      onComplete: () => hint.destroy(),
    });
  }
}
