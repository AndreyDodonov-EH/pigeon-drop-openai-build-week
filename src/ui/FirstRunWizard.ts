import Phaser from 'phaser';
import { W, H } from '../world/textures';
import { isTouchDevice } from '../input/TouchControls';
import { t } from '../i18n';

const CREAM = '#f3ead8';
const DEPTH = 30; // above HUD (10-12) and debug menu (20-21)

/** Shown every launch — it's one tap to dismiss. ?nowizard suppresses it
 * (headless test drivers need a clean scene). */
export function shouldShowWizard(): boolean {
  return !new URLSearchParams(location.search).has('nowizard');
}

/**
 * "How to play" overlay: dims the scene and shows the controls —
 * split touch zones on phones, key bindings on desktop. The first tap or
 * keypress dismisses it (and on touch that same tap already starts flying).
 */
export class FirstRunWizard {
  private objs: Phaser.GameObjects.GameObject[] = [];
  private dim: Phaser.GameObjects.Rectangle;
  private prompt!: Phaser.GameObjects.Text;
  private dismissed = false;

  constructor(
    private scene: Phaser.Scene,
    private onDismiss?: () => void,
  ) {
    this.dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x0a0b10, 0.72).setDepth(DEPTH);
    this.objs.push(this.dim);
    this.text(W / 2, H * 0.14, t.howToPlay, 14, 0.7);

    if (isTouchDevice()) {
      // no per-zone text: the tap-hand markers (TouchControls, depth 31,
      // above our dim) say it all, and they outlast this overlay until
      // each action is actually performed
      this.objs.push(
        scene.add.rectangle(W / 2, H * 0.42, 2, H * 0.5, 0xf3ead8, 0.25).setDepth(DEPTH),
      );
      this.prompt = this.text(W / 2, H * 0.78, t.tapStart, 16);
    } else {
      this.text(W / 2, H * 0.34, t.kbClimb, 20);
      this.text(W / 2, H * 0.44, t.kbDive, 20);
      this.text(W / 2, H * 0.54, t.kbRip, 20);
      // meta-control, so smaller and dimmer than the flight tips
      this.text(W / 2, H * 0.63, t.kbPause, 16, 0.8);
      this.prompt = this.text(W / 2, H * 0.76, t.clickStart, 16);
    }
    scene.tweens.add({
      targets: this.prompt,
      alpha: 0.35,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    scene.input.on('pointerdown', this.dismiss, this);
    scene.input.on('pointerdownoutside', this.dismiss, this);
    scene.input.keyboard?.on('keydown', this.dismiss, this);
  }

  private text(x: number, y: number, str: string, size: number, alpha = 1): Phaser.GameObjects.Text {
    const t = this.scene.add
      .text(x, y, str, { fontFamily: 'monospace', fontSize: `${size}px`, color: CREAM })
      .setOrigin(0.5)
      .setDepth(DEPTH)
      .setAlpha(alpha);
    this.objs.push(t);
    return t;
  }

  private dismiss(): void {
    if (this.dismissed) return;
    this.dismissed = true;
    this.onDismiss?.();
    this.scene.input.off('pointerdown', this.dismiss, this);
    this.scene.input.off('pointerdownoutside', this.dismiss, this);
    this.scene.input.keyboard?.off('keydown', this.dismiss, this);
    this.scene.tweens.killTweensOf(this.prompt);
    // the dim and the now-stale "tap to start" prompt get out of the way
    // fast, but the control instructions linger through the fullscreen +
    // rotation shuffle this same tap just triggered, then fade gently
    this.scene.tweens.add({
      targets: [this.dim, this.prompt],
      alpha: 0,
      duration: 250,
    });
    this.scene.tweens.add({
      targets: this.objs.filter((o) => o !== this.dim && o !== this.prompt),
      alpha: 0,
      delay: 1500,
      duration: 800,
      onComplete: () => this.objs.forEach((o) => o.destroy()),
    });
  }
}
