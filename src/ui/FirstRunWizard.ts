import Phaser from 'phaser';
import { W, H } from '../world/textures';
import { isTouchDevice } from '../input/TouchControls';
import { t } from '../i18n';

const SEEN_KEY = 'sp-wizard-seen';
const CREAM = '#f3ead8';
const DEPTH = 30; // above HUD (10-12) and debug menu (20-21)

/** First-run only, unless forced with ?wizard (or suppressed with ?nowizard —
 * headless test drivers get fresh localStorage every launch and would otherwise
 * always see it). If localStorage is blocked we just show it every visit —
 * it's one tap to dismiss. */
export function shouldShowWizard(): boolean {
  const params = new URLSearchParams(location.search);
  if (params.has('nowizard')) return false;
  if (params.has('wizard')) return true;
  try {
    return localStorage.getItem(SEEN_KEY) === null;
  } catch {
    return true;
  }
}

/**
 * One-time "how to play" overlay: dims the scene and shows the controls —
 * split touch zones on phones, key bindings on desktop. The first tap or
 * keypress dismisses it (and on touch that same tap already starts flying).
 */
export class FirstRunWizard {
  private objs: Phaser.GameObjects.GameObject[] = [];
  private prompt!: Phaser.GameObjects.Text;
  private dismissed = false;

  constructor(private scene: Phaser.Scene) {
    this.objs.push(scene.add.rectangle(W / 2, H / 2, W, H, 0x0a0b10, 0.72).setDepth(DEPTH));
    this.text(W / 2, H * 0.14, t.howToPlay, 14, 0.7);

    if (isTouchDevice()) {
      this.objs.push(
        scene.add.rectangle(W / 2, H * 0.42, 2, H * 0.5, 0xf3ead8, 0.25).setDepth(DEPTH),
      );
      this.text(W * 0.25, H * 0.3, '▲', 44);
      this.text(W * 0.25, H * 0.44, t.holdClimb, 20);
      this.text(W * 0.25, H * 0.53, `${t.dragDive} ▼`, 15, 0.8);
      this.text(W * 0.75, H * 0.3, '💩', 44);
      this.text(W * 0.75, H * 0.44, t.holdRip, 20);
      this.prompt = this.text(W / 2, H * 0.78, t.tapStart, 16);
    } else {
      this.text(W / 2, H * 0.34, t.kbClimb, 20);
      this.text(W / 2, H * 0.44, t.kbDive, 20);
      this.text(W / 2, H * 0.54, t.kbRip, 20);
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
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode — it'll just show again next visit */
    }
    this.scene.input.off('pointerdown', this.dismiss, this);
    this.scene.input.off('pointerdownoutside', this.dismiss, this);
    this.scene.input.keyboard?.off('keydown', this.dismiss, this);
    this.scene.tweens.killTweensOf(this.prompt);
    this.scene.tweens.add({
      targets: this.objs,
      alpha: 0,
      duration: 350,
      onComplete: () => this.objs.forEach((o) => o.destroy()),
    });
  }
}
