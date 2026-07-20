import Phaser from 'phaser';
import { W, H } from '../world/textures';
import { isTouchDevice } from '../input/TouchControls';
import { requestFullscreen, lockLandscapeOnFullscreen } from '../input/fullscreen';
import { t } from '../i18n';

const COLOR_CREAM = '#f3ead8';
const COLOR_INK = '#1d1f2a';

const PIGEON_SCALE = 0.6;
// the shipped sprite canvas has empty padding below the feet (foot baseline
// sits at source y=358 of a 444-tall canvas, per assets/ART_LOG.md) — anchor
// on the actual feet, not the raw image bottom, or the bird floats above
// whatever it's supposed to be standing on
const PIGEON_FOOT_FRACTION = 358 / 444;
// fraction of screen height where the title art's ledge top surface sits,
// measured directly from public/assets/sprites/title-bg.png
const LEDGE_Y_FRACTION = 0.798;
// time spent on each in-between head-turn frame
const TURN_STEP_MS = 160;
// how long it holds the camera-facing smirk before the game begins
const SMIRK_HOLD_MS = 900;
const FADE_MS = 450;
// entering fullscreen (Android) triggers a resize/orientation-lock that
// visually clashes with the head-turn if both happen in the same instant —
// give it a beat to settle first. iOS has no fullscreen API and desktop
// mouse clicks never request it, so neither is delayed.
const FULLSCREEN_SETTLE_MS = 350;

const PIGEON_FRAMES = ['pigeon-perch-f0', 'pigeon-perch-f1', 'pigeon-perch-f2'];

/**
 * First thing the player sees. A single non-animated pigeon overlay sits on
 * the background's rooftop ledge — nothing moves, so the whole screen reads
 * as one static piece of key art for however long the player looks at it.
 * The same tap/click/key that starts the game also triggers the reveal: the
 * pigeon turns its head to look straight at the camera (same conspiratorial
 * smirk as GameScene's post-hit glance, now on its own dedicated perched
 * sprite), holds a beat, then the screen fades into GameScene.
 * See BACKLOG.md "Demo wrapping".
 */
export class TitleScene extends Phaser.Scene {
  private pigeonImg!: Phaser.GameObjects.Image;
  private prompt!: Phaser.GameObjects.Text;
  private activated = false;

  constructor() {
    super('title');
  }

  preload(): void {
    this.load.image('title-bg', 'assets/sprites/title-bg.png');
    this.load.image('title-logo', 'assets/sprites/title-logo.png');
    for (const key of PIGEON_FRAMES) this.load.image(key, `assets/sprites/${key}.png`);
  }

  create(): void {
    // key art fills the frame edge-to-edge; the source is cut wider than
    // the widest supported aspect so it always covers without letterboxing
    const bg = this.add.image(W / 2, H / 2, 'title-bg').setDepth(0);
    bg.setScale(H / bg.height);

    // fully static — no bob, no idle animation — so this genuinely reads as
    // one flat painting until the reveal fires
    this.pigeonImg = this.add
      .image(W * 0.66, H * LEDGE_Y_FRACTION, PIGEON_FRAMES[0])
      .setScale(PIGEON_SCALE)
      .setOrigin(0.5, PIGEON_FOOT_FRACTION)
      .setDepth(2);

    // generated wordmark art (see assets/ART_LOG.md) — not localized, same as
    // most games keep their logotype in one language across locales
    // drippy wordmark is taller than letterforms alone — scale to ~22% of H so
    // the glyph bodies still read as a hero logotype above the tagline
    const logo = this.add.image(W / 2, H * 0.18, 'title-logo').setOrigin(0.5).setDepth(3);
    logo.setScale((H * 0.22) / logo.height);

    // a light italic serif byline, in the logo's own near-black outline
    // color, reads as a tagline instead of shouting in the same bold block
    // font as the UI prompts below it
    this.add
      .text(W / 2, H * 0.36, t.tagline, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontStyle: 'italic',
        fontSize: `${Math.round(H * 0.03)}px`,
        color: '#000000',
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setAlpha(0.85)
      .setShadow(0, 2, 'rgba(0,0,0,0.35)', 3);

    this.prompt = this.add
      .text(W / 2, H * 0.86, isTouchDevice() ? t.tapStart : t.clickStart, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: `${Math.round(H * 0.032)}px`,
        color: COLOR_CREAM,
        stroke: COLOR_INK,
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.tweens.add({ targets: this.prompt, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });

    this.cameras.main.fadeIn(500, 0, 0, 0);
    lockLandscapeOnFullscreen(this);

    // the title tap is the very first user gesture on mobile, so fullscreen
    // is requested here rather than waiting for the first tap in GameScene
    this.input.once('pointerdown', (p: Phaser.Input.Pointer) => this.onActivate(p.wasTouch));
    this.input.keyboard?.once('keydown', () => this.onActivate(false));
  }

  /** Shared entry point for both the tap and keyboard triggers. Gives instant
   * feedback (prompt snaps solid) no matter what happens with fullscreen
   * below, then either waits out the fullscreen transition or reveals right
   * away. `requestFullscreen`'s return value — not a separately re-derived
   * guess — decides whether that transition is actually coming, so this
   * can't disagree with what it actually did. */
  private onActivate(wasTouch: boolean): void {
    if (this.activated) return;
    this.activated = true;
    this.tweens.killTweensOf(this.prompt);
    this.tweens.add({ targets: this.prompt, alpha: 1, duration: 120 });

    const enteringFullscreen = wasTouch && requestFullscreen(this);
    if (enteringFullscreen) this.time.delayedCall(FULLSCREEN_SETTLE_MS, () => this.reveal());
    else this.reveal();
  }

  /** the pigeon turns to face the camera, holds the smirk, then the title fades into gameplay */
  private reveal(): void {
    PIGEON_FRAMES.slice(1).forEach((key, i) => {
      this.time.delayedCall(TURN_STEP_MS * (i + 1), () => this.pigeonImg.setTexture(key));
    });
    this.time.delayedCall(TURN_STEP_MS * (PIGEON_FRAMES.length - 1) + SMIRK_HOLD_MS, () => {
      this.cameras.main.fadeOut(FADE_MS, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('game'));
    });
  }
}
