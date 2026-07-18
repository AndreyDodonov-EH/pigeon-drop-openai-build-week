import Phaser from 'phaser';
import { MUSIC_VOLUME } from './mix';

// Two 60 s loops generated on the same 120 BPM / D-minor grid. Both play from
// t=0 in lockstep and never stop; combo tier only moves their volumes, so the
// sneaky→klezmer handoff lands on the shared beat grid instead of restarting.
const FADE_MS = 900;
const KLEZMER_AT_COMBO = 4;
// relative balance within the music bus — klezmer is mixed denser/louder at
// the source, so it gets less headroom
const VOL = { sneaky: 1 * MUSIC_VOLUME, klezmer: 0.82 * MUSIC_VOLUME };

export class MusicManager {
  private scene: Phaser.Scene;
  private sneaky: Phaser.Sound.WebAudioSound;
  private klezmer: Phaser.Sound.WebAudioSound;
  private frantic = false;
  private started = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sneaky = scene.sound.add('music-sneaky', {
      loop: true,
      volume: VOL.sneaky,
    }) as Phaser.Sound.WebAudioSound;
    this.klezmer = scene.sound.add('music-klezmer', {
      loop: true,
      volume: 0,
    }) as Phaser.Sound.WebAudioSound;
    // sounds live on the global sound manager, not the scene
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sneaky.destroy();
      this.klezmer.destroy();
    });
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    const go = () => {
      this.sneaky.play();
      this.klezmer.play();
    };
    if (this.scene.sound.locked) this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, go);
    else go();
  }

  get franticNow(): boolean {
    return this.frantic;
  }

  setCombo(combo: number): void {
    const frantic = combo >= KLEZMER_AT_COMBO;
    if (frantic === this.frantic) return;
    this.frantic = frantic;
    const fadeIn = frantic ? this.klezmer : this.sneaky;
    const fadeOut = frantic ? this.sneaky : this.klezmer;
    // The two files differ by ~50 ms per loop pass, so a layer that has sat
    // silent for a while drifts off the audible track's clock — snap it back
    // before it becomes audible again.
    if (fadeIn.volume < 0.01 && fadeOut.isPlaying) {
      fadeIn.setSeek(fadeOut.seek % fadeIn.duration);
    }
    this.scene.tweens.killTweensOf([fadeIn, fadeOut]);
    this.scene.tweens.add({
      targets: fadeIn,
      volume: frantic ? VOL.klezmer : VOL.sneaky,
      duration: FADE_MS,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: fadeOut,
      volume: 0,
      duration: FADE_MS,
      ease: 'Sine.easeInOut',
    });
  }
}
