import Phaser from 'phaser';
import { W, H } from '../world/textures';
import { t } from '../i18n';

/** Coarse-pointer check for cosmetic gating (hints, debug menu). Gameplay
 * reacts to actual touch events via `pointer.wasTouch`, never this. */
export const isTouchDevice = (): boolean =>
  window.matchMedia('(pointer: coarse)').matches;

// Dive ratchet thresholds, in game pixels (960×540 space). Asymmetric on
// purpose: entering a dive takes a deliberate pull, returning to climb is
// slightly easier so pumping between the two feels responsive.
const DIVE_ON = 36;
const DIVE_OFF = 24;

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
  private leftHint?: Phaser.GameObjects.Text;
  private rightHint?: Phaser.GameObjects.Text;

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
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.game.events.off(Phaser.Core.Events.BLUR, this.releaseAll, this);
    });

    if (isTouchDevice()) this.createHints();
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
        this.fadeHint(this.leftHint);
        this.leftHint = undefined;
      }
    } else if (this.poopId < 0) {
      this.poopId = p.id;
      this.poop = true;
      this.fadeHint(this.rightHint);
      this.rightHint = undefined;
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
    }
    if (p.id === this.poopId) {
      this.poopId = -1;
      this.poop = false;
    }
  }

  private releaseAll(): void {
    this.flyId = -1;
    this.poopId = -1;
    this.fly = false;
    this.dive = false;
    this.poop = false;
  }

  private tryFullscreen(): void {
    const scale = this.scene.scale;
    if (!scale.fullscreen.available || scale.isFullscreen) return; // iOS Safari: unavailable, no-op
    try {
      scale.startFullscreen();
      (screen.orientation as any)?.lock?.('landscape')?.catch(() => {});
    } catch {
      /* user gesture expired or browser refused — try again next tap */
    }
  }

  private createHints(): void {
    this.leftHint = this.scene.add
      .text(W * 0.25, H - 60, `${t.holdClimb}   ·   ${t.dragDive}`, HINT_STYLE)
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0.55);
    this.rightHint = this.scene.add
      .text(W * 0.75, H - 60, t.holdRip, HINT_STYLE)
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0.55);
    this.scene.time.delayedCall(8000, () => {
      this.fadeHint(this.leftHint);
      this.fadeHint(this.rightHint);
      this.leftHint = undefined;
      this.rightHint = undefined;
    });
  }

  private fadeHint(hint?: Phaser.GameObjects.Text): void {
    if (!hint) return;
    this.scene.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 500,
      onComplete: () => hint.destroy(),
    });
  }
}
