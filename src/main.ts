import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { TitleScene } from './scenes/TitleScene';
import { W, H, RES } from './world/textures';

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: Math.round(W * RES),
  height: Math.round(H * RES),
  backgroundColor: '#14161f',
  scale: {
    mode: Phaser.Scale.FIT,
    // the #game flex container centers the canvas; CENTER_BOTH would add its
    // own margins on top and double-shift it off-center
    autoCenter: Phaser.Scale.NO_CENTER,
    // fullscreen the flex container, not Phaser's injected wrapper div,
    // so the canvas stays centered in fullscreen too
    fullscreenTarget: 'game',
  },
  input: {
    activePointers: 3, // mouse + two simultaneous thumbs
    touch: { target: window }, // thumbs rest in the FIT letterbox bars, outside the canvas
  },
  render: {
    antialias: true,
    roundPixels: false,
  },
  scene: [TitleScene, GameScene],
});

// mobile browsers fire the rotation resize while the old viewport numbers
// are still live, so FIT keeps the previous orientation's size; re-measure
// once the viewport settles (twice — some devices report late)
const remeasure = (): void => {
  setTimeout(() => game.scale.refresh(), 300);
  setTimeout(() => game.scale.refresh(), 900);
};
screen.orientation?.addEventListener('change', remeasure);
window.addEventListener('orientationchange', remeasure);

// the CSS #rotate-overlay covers the canvas in portrait (see index.html),
// but nothing stopped the game (or its music) running underneath it. Freeze
// the whole Phaser loop while the overlay is up; game.pause()/resume() are
// idempotent so no extra bookkeeping is needed. Leave audio alone if the
// player already paused manually — GameScene's own pause menu owns sound
// state in that case, in both directions.
const portraitQuery = window.matchMedia('(orientation: portrait) and (pointer: coarse)');
const syncOrientationPause = (portrait: boolean): void => {
  const scenePaused = (
    window as unknown as { SP?: { isPaused?: () => boolean } }
  ).SP?.isPaused?.();
  if (portrait) {
    game.pause();
    if (!scenePaused) game.sound.pauseAll();
  } else {
    game.resume();
    if (!scenePaused) game.sound.resumeAll();
  }
};
syncOrientationPause(portraitQuery.matches);
portraitQuery.addEventListener('change', (e) => syncOrientationPause(e.matches));
