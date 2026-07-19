import Phaser from 'phaser';
import { MUSIC_VOLUME } from './mix';

// Three synchronized layers on one 120 BPM / D-minor grid, all playing from
// t=0 in lockstep and never stopping; combo only moves volumes.
//  - sneaky: base pizzicato loop, always audible.
//  - echo: the SAME pizzicato file offset by an eighth note. The interleaved
//    plucks double the perceived pulse — the "tempo goes up" feel — without
//    touching playback rate, so no pitch shift and no leaving the beat grid.
//  - klezmer: street-party topper for combo >= 4, swelling as the combo grows.
const FADE_MS = 900;
const KLEZMER_FADE_OUT_MS = 2400;
// After the combo breaks the party doesn't stop on a dime: klezmer holds for
// two bars, then takes its long release.
const KLEZMER_HOLD_MS = 1000;
const ECHO_OFFSET_S = 60 / 120 / 2; // eighth note at 120 BPM
const ECHO_AT_COMBO = 2;
const KLEZMER_AT_COMBO = 4;
const KLEZMER_MAX_COMBO = 8;

type MixTarget = { sneaky: number; echo: number; klezmer: number };

// Klezmer's measured average is 3.6 dB louder than sneaky's. These targets
// compensate for that density and leave headroom when all layers are audible.
function mixForCombo(combo: number): MixTarget {
  if (combo >= KLEZMER_AT_COMBO) {
    // klezmer swells with the combo: 0.40 at x4 up to 0.58 at the x8 cap
    const t = Math.min((combo - KLEZMER_AT_COMBO) / (KLEZMER_MAX_COMBO - KLEZMER_AT_COMBO), 1);
    return { sneaky: 0.82, echo: 0.6, klezmer: 0.4 + 0.18 * t };
  }
  if (combo >= ECHO_AT_COMBO) return { sneaky: 1, echo: 0.75, klezmer: 0 };
  return { sneaky: 1, echo: 0, klezmer: 0 };
}

export class MusicManager {
  private scene: Phaser.Scene;
  private sneaky: Phaser.Sound.WebAudioSound;
  private echo: Phaser.Sound.WebAudioSound;
  private klezmer: Phaser.Sound.WebAudioSound;
  private mix: MixTarget = mixForCombo(0);
  private klezmerHold?: Phaser.Time.TimerEvent;
  private started = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sneaky = scene.sound.add('music-sneaky', {
      loop: true,
      volume: this.mix.sneaky * MUSIC_VOLUME,
    }) as Phaser.Sound.WebAudioSound;
    this.echo = scene.sound.add('music-sneaky', {
      loop: true,
      volume: 0,
    }) as Phaser.Sound.WebAudioSound;
    this.klezmer = scene.sound.add('music-klezmer', {
      loop: true,
      volume: 0,
    }) as Phaser.Sound.WebAudioSound;
    // sounds live on the global sound manager, not the scene
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sneaky.destroy();
      this.echo.destroy();
      this.klezmer.destroy();
    });
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    const go = () => {
      this.sneaky.play();
      this.echo.play();
      this.klezmer.play();
    };
    if (this.scene.sound.locked) this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, go);
    else go();
  }

  get franticNow(): boolean {
    return this.mix.klezmer > 0;
  }

  setCombo(combo: number): void {
    const next = mixForCombo(combo);
    const prev = this.mix;
    if (next.sneaky === prev.sneaky && next.echo === prev.echo && next.klezmer === prev.klezmer) {
      return;
    }
    this.mix = next;

    // A layer that has sat silent drifts off the audible track's clock (the
    // klezmer file differs by ~50 ms per loop pass, and mobile audio suspends
    // can desync anything) — snap it into place before it becomes audible.
    if (this.sneaky.isPlaying) {
      if (this.echo.volume < 0.01 && next.echo > 0) {
        this.echo.setSeek((this.sneaky.seek + ECHO_OFFSET_S) % this.echo.duration);
      }
      if (this.klezmer.volume < 0.01 && next.klezmer > 0) {
        this.klezmer.setSeek(this.sneaky.seek % this.klezmer.duration);
      }
    }

    this.fadeTo(this.sneaky, next.sneaky * MUSIC_VOLUME, FADE_MS);
    this.fadeTo(this.echo, next.echo * MUSIC_VOLUME, FADE_MS);

    this.klezmerHold?.remove();
    this.klezmerHold = undefined;
    const kTarget = next.klezmer * MUSIC_VOLUME;
    if (kTarget >= this.klezmer.volume) {
      this.fadeTo(this.klezmer, kTarget, FADE_MS);
    } else {
      this.klezmerHold = this.scene.time.delayedCall(KLEZMER_HOLD_MS, () => {
        this.fadeTo(this.klezmer, kTarget, KLEZMER_FADE_OUT_MS);
      });
    }
  }

  private fadeTo(sound: Phaser.Sound.WebAudioSound, volume: number, duration: number): void {
    this.scene.tweens.killTweensOf(sound);
    this.scene.tweens.add({
      targets: sound,
      volume,
      duration,
      ease: 'Sine.easeInOut',
    });
  }
}
