import Phaser from 'phaser';
import { t } from '../i18n';
import { isTouchDevice } from '../input/TouchControls';
import { W, H } from '../world/textures';

const BUTTON_DEPTH = 25; // above debug menu (20-21), below the first-run wizard (30)
const MODAL_DEPTH = 40; // above everything, incl. the touch hint markers (31)
const CREAM = '#f3ead8';
const INK = 0x1d1f2a;
const AMBER = 0xffd34e;

/**
 * Pause HUD button and modal. Gameplay owns the actual freeze; this class only
 * presents the controls and reports pause/resume requests.
 */
export class PauseMenu {
  private pauseButton: Phaser.GameObjects.Container;
  private pauseHit!: Phaser.GameObjects.Arc;
  private modal: Phaser.GameObjects.Container;
  private resumeHit!: Phaser.GameObjects.Rectangle;
  private enabled = true;

  constructor(
    private scene: Phaser.Scene,
    private onToggle: () => void,
  ) {
    this.pauseButton = this.createPauseButton();
    this.modal = this.createModal();

    scene.input.keyboard?.on('keydown-P', this.onKeyboardToggle, this);
    scene.input.keyboard?.on('keydown-ESC', this.onKeyboardToggle, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.keyboard?.off('keydown-P', this.onKeyboardToggle, this);
      scene.input.keyboard?.off('keydown-ESC', this.onKeyboardToggle, this);
    });

    this.setPaused(false);
  }

  setPaused(paused: boolean): void {
    this.pauseButton.setVisible(!paused);
    this.modal.setVisible(paused);
    if (paused) {
      this.pauseHit.disableInteractive();
      this.resumeHit.setInteractive({ useHandCursor: true });
    } else {
      this.resumeHit.disableInteractive();
      this.pauseHit.setInteractive({ useHandCursor: true });
    }
  }

  /** While the first-run wizard is up the pause controls step aside: the
   * button would otherwise steal (and swallow) the dismissing tap, and the
   * P/ESC hotkeys would start the game straight into the pause modal. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.pauseButton.setVisible(enabled);
    if (enabled) this.pauseHit.setInteractive({ useHandCursor: true });
    else this.pauseHit.disableInteractive();
  }

  private createPauseButton(): Phaser.GameObjects.Container {
    const x = W - 30;
    const y = 29;
    const button = this.scene.add.container(x, y).setDepth(BUTTON_DEPTH);
    this.pauseHit = this.scene.add
      .circle(0, 0, 19, INK, 0.88)
      .setStrokeStyle(2, 0xf3ead8, 0.75);
    // visual stays 19px; phones get a fatter invisible target (the canvas
    // scales down on screen, so 19px game-space lands under the ~44pt guideline).
    // Later setInteractive() calls only re-enable — this hit area sticks.
    this.pauseHit.setInteractive({
      hitArea: new Phaser.Geom.Circle(19, 19, isTouchDevice() ? 32 : 19),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true,
    });
    const icon = this.scene.add.graphics();
    icon.fillStyle(0xf3ead8, 1);
    icon.fillRoundedRect(-6, -8, 4, 16, 1);
    icon.fillRoundedRect(2, -8, 4, 16, 1);
    button.add([this.pauseHit, icon]);

    this.swallowTap(this.pauseHit, this.onToggle);
    this.pauseHit.on('pointerover', () => this.pauseHit.setFillStyle(0x394257, 1));
    this.pauseHit.on('pointerout', () => this.pauseHit.setFillStyle(INK, 0.88));
    return button;
  }

  private createModal(): Phaser.GameObjects.Container {
    const modal = this.scene.add.container(0, 0).setDepth(MODAL_DEPTH);
    const dim = this.scene.add
      .rectangle(W / 2, H / 2, W, H, 0x0a0b10, 0.78)
      .setInteractive();
    // Swallow taps outside the resume button so paused touch input cannot be
    // left held when play resumes.
    this.swallowTap(dim);

    const title = this.scene.add
      .text(W / 2, H * 0.33, t.paused, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '46px',
        color: CREAM,
        stroke: '#1d1f2a',
        strokeThickness: 7,
      })
      .setOrigin(0.5);

    this.resumeHit = this.scene.add
      .rectangle(W / 2, H * 0.52, 230, 62, AMBER, 1)
      .setStrokeStyle(4, INK, 1)
      .setInteractive({ useHandCursor: true });
    const resumeLabel = this.scene.add
      .text(W / 2, H * 0.52, t.resume, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '24px',
        color: '#1d1f2a',
      })
      .setOrigin(0.5);

    this.swallowTap(this.resumeHit, this.onToggle);
    this.resumeHit.on('pointerover', () => this.resumeHit.setFillStyle(0xffe37a, 1));
    this.resumeHit.on('pointerout', () => this.resumeHit.setFillStyle(AMBER, 1));

    modal.add([dim, title, this.resumeHit, resumeLabel]);

    // keyboard hint means nothing on a phone
    if (!isTouchDevice()) {
      const hint = this.scene.add
        .text(W / 2, H * 0.65, t.pauseHint, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: CREAM,
        })
        .setOrigin(0.5)
        .setAlpha(0.72);
      modal.add(hint);
    }
    return modal;
  }

  /** pointerdown that must not leak to scene-level input (TouchControls,
   * mouse fly/poop) — stops propagation, then runs the action if given. */
  private swallowTap(target: Phaser.GameObjects.GameObject, action?: () => void): void {
    target.on(
      'pointerdown',
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        action?.();
      },
    );
  }

  private onKeyboardToggle(event: KeyboardEvent): void {
    if (!this.enabled || event.repeat) return;
    event.preventDefault();
    this.onToggle();
  }
}
